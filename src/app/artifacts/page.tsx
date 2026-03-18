'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';

// 文件分类类型
type FileCategory = 'delivery' | 'source' | 'docs' | 'other';

interface ArtifactFile {
  name: string;
  size: number;
  created_at: string;
  modified_at: string;
  category?: FileCategory;
}

interface FileDetail {
  name: string;
  content: string;
  size: number;
  created_at: string;
  modified_at: string;
}

interface ProjectInfo {
  id: string;
  files: ArtifactFile[];
  hasHtml: boolean;
  deliveryFiles: ArtifactFile[];
  sourceFiles: ArtifactFile[];
  docFiles: ArtifactFile[];
  otherFiles: ArtifactFile[];
}

// 文件分类逻辑
function classifyFile(filename: string): FileCategory {
  const name = filename.toLowerCase();
  
  // 最终交付文件
  if (name === 'index.html' || name === 'readme.md') {
    return 'delivery';
  }
  
  // 文档文件
  if (name.endsWith('.md') && name !== 'readme.md') {
    return 'docs';
  }
  if (name === 'report.md' || name.includes('report')) {
    return 'docs';
  }
  
  // 源代码文件
  const sourceExtensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.java', '.go', '.rs', '.c', '.cpp', '.h'];
  if (sourceExtensions.some(ext => name.endsWith(ext))) {
    return 'source';
  }
  
  // 其他 HTML 文件（非 index.html）也视为交付
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    return 'delivery';
  }
  
  return 'other';
}

// 获取文件图标
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    py: '🐍',
    js: '📜',
    ts: '📘',
    tsx: '⚛️',
    jsx: '⚛️',
    json: '📋',
    yaml: '⚙️',
    yml: '⚙️',
    md: '📝',
    txt: '📄',
    html: '🌐',
    htm: '🌐',
    css: '🎨',
    java: '☕',
    go: '🐹',
    rs: '🦀',
    c: '🔧',
    cpp: '🔧',
    h: '📝',
    fig: '🎨',
  };
  return icons[ext || ''] || '📄';
}

// 获取分类图标和名称
function getCategoryInfo(category: FileCategory): { icon: string; name: string; color: string } {
  const info = {
    delivery: { icon: '🚀', name: '最终交付', color: 'bg-green-100 text-green-700' },
    source: { icon: '💻', name: '源代码', color: 'bg-blue-100 text-blue-700' },
    docs: { icon: '📚', name: '文档', color: 'bg-purple-100 text-purple-700' },
    other: { icon: '📦', name: '其他', color: 'bg-gray-100 text-gray-600' },
  };
  return info[category];
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 检查是否为 HTML 文件
function isHtmlFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'html' || ext === 'htm';
}

function ArtifactsContent() {
  const searchParams = useSearchParams();
  const urlProject = searchParams.get('project');
  const urlFile = searchParams.get('file');

  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/artifacts');
      const data = await res.json();
      const projectIds: string[] = data.projects || [];
      
      // 加载每个项目的文件信息
      const projectInfos = await Promise.all(
        projectIds.map(async (id) => {
          const fileRes = await fetch(`/api/artifacts/${id}`);
          const fileData = await fileRes.json();
          const files: ArtifactFile[] = (fileData.files || []).map((f: ArtifactFile) => ({
            ...f,
            category: classifyFile(f.name),
          }));
          
          return {
            id,
            files,
            hasHtml: files.some(f => isHtmlFile(f.name)),
            deliveryFiles: files.filter(f => f.category === 'delivery'),
            sourceFiles: files.filter(f => f.category === 'source'),
            docFiles: files.filter(f => f.category === 'docs'),
            otherFiles: files.filter(f => f.category === 'other'),
          };
        })
      );
      
      // 按修改时间排序（最新的在前）
      projectInfos.sort((a, b) => {
        const latestA = Math.max(...a.files.map(f => new Date(f.modified_at).getTime()));
        const latestB = Math.max(...b.files.map(f => new Date(f.modified_at).getTime()));
        return latestB - latestA;
      });
      
      setProjects(projectInfos);
      
      // 如果 URL 中有项目参数，自动展开
      if (urlProject) {
        setExpandedProjects(new Set([urlProject]));
        setSelectedProjectId(urlProject);
        if (urlFile) {
          loadFileContent(urlProject, urlFile);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadFileContent(projectId: string, fileName: string) {
    setFileLoading(true);
    try {
      const res = await fetch(`/api/artifacts/${projectId}/${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.file) {
        setSelectedFile(data.file);
        setSelectedProjectId(projectId);
      }
    } finally {
      setFileLoading(false);
    }
  }

  function toggleProject(projectId: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  // 渲染文件项
  function renderFileItem(file: ArtifactFile, projectId: string) {
    const isSelected = selectedFile?.name === file.name && selectedProjectId === projectId;
    const categoryInfo = getCategoryInfo(file.category || 'other');
    
    return (
      <div
        key={file.name}
        onClick={() => loadFileContent(projectId, file.name)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-orange-50 border border-[#FF6B3D]/30'
            : 'hover:bg-gray-50'
        }`}
      >
        <span className="text-base">{getFileIcon(file.name)}</span>
        <span className="text-sm flex-1 truncate text-[#1A1A2E]">{file.name}</span>
        <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
      </div>
    );
  }

  // 渲染项目卡片
  function renderProjectCard(project: ProjectInfo) {
    const isExpanded = expandedProjects.has(project.id);
    const totalFiles = project.files.length;
    const latestModified = project.files.length > 0 
      ? formatDate(project.files.reduce((latest, f) => 
          new Date(f.modified_at) > new Date(latest.modified_at) ? f : f
        , project.files[0]).modified_at)
      : '-';
    
    return (
      <Card key={project.id} className="border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => toggleProject(project.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D]/10 to-[#FF6B3D]/20 flex items-center justify-center">
                <span className="text-lg">📁</span>
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{project.id}</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalFiles} 个文件 · {latestModified}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {project.hasHtml && (
                <Link
                  href={`/preview/${project.id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-white bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] px-3 py-1.5 rounded-full hover:shadow-lg flex items-center gap-1"
                >
                  🌐 打开网页
                </Link>
              )}
              <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 border-t border-gray-50">
            {/* 最终交付 */}
            {project.deliveryFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-sm">{getCategoryInfo('delivery').icon}</span>
                  <span className="text-xs font-medium text-gray-600">最终交付</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {project.deliveryFiles.length}
                  </Badge>
                </div>
                <div className="bg-green-50/50 rounded-lg p-1">
                  {project.deliveryFiles.map(f => renderFileItem(f, project.id))}
                </div>
              </div>
            )}
            
            {/* 源代码 */}
            {project.sourceFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-sm">{getCategoryInfo('source').icon}</span>
                  <span className="text-xs font-medium text-gray-600">源代码</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {project.sourceFiles.length}
                  </Badge>
                </div>
                <div className="bg-blue-50/50 rounded-lg p-1">
                  {project.sourceFiles.map(f => renderFileItem(f, project.id))}
                </div>
              </div>
            )}
            
            {/* 文档 */}
            {project.docFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-sm">{getCategoryInfo('docs').icon}</span>
                  <span className="text-xs font-medium text-gray-600">文档</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {project.docFiles.length}
                  </Badge>
                </div>
                <div className="bg-purple-50/50 rounded-lg p-1">
                  {project.docFiles.map(f => renderFileItem(f, project.id))}
                </div>
              </div>
            )}
            
            {/* 其他文件 */}
            {project.otherFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-sm">{getCategoryInfo('other').icon}</span>
                  <span className="text-xs font-medium text-gray-600">其他</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {project.otherFiles.length}
                  </Badge>
                </div>
                <div className="bg-gray-50/50 rounded-lg p-1">
                  {project.otherFiles.map(f => renderFileItem(f, project.id))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">Artifacts</h1>
        <p className="text-xs text-gray-400 mt-0.5">项目产物与交付文件</p>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#FF6B3D] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mx-auto mb-4">
            📦
          </div>
          <p className="text-gray-400 text-sm">暂无产出文件</p>
          <p className="text-gray-300 text-xs mt-2">与 AI 对话并确认任务后，产出文件将显示在这里</p>
          <Link
            href="/chat"
            className="inline-block mt-4 text-sm text-[#FF6B3D] hover:underline"
          >
            开始对话 →
          </Link>
        </div>
      )}

      {/* 项目列表 */}
      {!loading && projects.length > 0 && (
        <div className="px-4 py-4 space-y-3">
          {/* 统计信息 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              共 {projects.length} 个项目
            </span>
          </div>
          
          {/* 项目卡片 */}
          {projects.map(project => renderProjectCard(project))}
        </div>
      )}

      {/* 文件预览模态框 */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedFile(null)}
        >
          <div 
            className="bg-white w-full max-w-2xl max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 文件头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFileIcon(selectedFile.name)}</span>
                <div>
                  <h3 className="font-medium text-sm text-[#1A1A2E]">{selectedFile.name}</h3>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(selectedFile.size)} · {formatDate(selectedFile.modified_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isHtmlFile(selectedFile.name) && selectedProjectId && (
                  <Link
                    href={`/preview/${selectedProjectId}`}
                    target="_blank"
                    className="text-xs text-white bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] px-3 py-1.5 rounded-full hover:shadow-lg flex items-center gap-1"
                  >
                    🔗 打开预览
                  </Link>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedFile.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-xs text-gray-500 hover:text-[#FF6B3D] px-2 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  下载
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(selectedFile.content)}
                  className="text-xs text-gray-500 hover:text-[#FF6B3D] px-2 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  复制
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* 文件内容 */}
            <div className="overflow-auto max-h-[60vh]">
              {fileLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-[#FF6B3D] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isHtmlFile(selectedFile.name) ? (
                <div className="p-4 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <iframe
                      srcDoc={selectedFile.content}
                      className="w-full h-48 rounded border border-gray-200 bg-white"
                      title="HTML Preview"
                    />
                  </div>
                  <details className="bg-gray-900 rounded-lg">
                    <summary className="text-xs text-gray-400 cursor-pointer px-3 py-2 hover:text-gray-300">
                      查看源代码
                    </summary>
                    <div className="p-3 font-mono text-xs text-gray-300 overflow-auto">
                      <pre className="whitespace-pre-wrap break-all">{selectedFile.content}</pre>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="p-4">
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300 overflow-auto">
                    <pre className="whitespace-pre-wrap break-all">{selectedFile.content}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function ArtifactsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#FF6B3D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    </div>}>
      <ArtifactsContent />
    </Suspense>
  );
}