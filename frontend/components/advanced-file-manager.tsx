'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Trash2, 
  UserX, 
  Share2, 
  HardDrive, 
  FileText, 
  AlertTriangle
} from 'lucide-react';
import type { File } from '@/types';

interface FileActionsProps {
  file: File;
  onRemove?: () => void;
  onDelete?: () => void;
}

function FileActions({ file, onRemove, onDelete }: FileActionsProps) {
  const { removeFiles, deleteFiles } = useApp();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemove = async () => {
    if (!file.isOwnedByUser) {
      const confirmed = window.confirm(
        `Are you sure you want to remove "${file.name}" from your view? This will not delete the original file.`
      );
      if (!confirmed) return;

      setIsRemoving(true);
      try {
        await removeFiles([file.fileid]);
        toast.success(`Removed ${file.name} from your view`);
        onRemove?.();
      } catch (error) {
        toast.error(`Failed to remove ${file.name}`);
        console.error('Remove error:', error);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (file.isOwnedByUser) {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      setIsDeleting(true);
      try {
        await deleteFiles([file.fileid]);
        toast.success(`Deleted ${file.name}`);
        onDelete?.();
      } catch (error) {
        toast.error(`Failed to delete ${file.name}`);
        console.error('Delete error:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Number.parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{file.name}</span>
            <div className="flex gap-2">
              {file.isShared && (
                <Badge variant="secondary" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Shared
                </Badge>
              )}
              {file.isOwnedByUser ? (
                <Badge variant="default" className="text-xs">Owner</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Not Owner</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(file.size)}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{file.mimeType}</span>
            </div>
            <div>
              <span className="text-gray-600">Owner:</span>
              <span className="ml-2 font-medium text-xs">{file.ownerEmail}</span>
            </div>
            <div>
              <span className="text-gray-600">Modified:</span>
              <span className="ml-2 font-medium text-xs">
                {file.lastModifiedTime ? new Date(file.lastModifiedTime).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {file.isOwnedByUser ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
              >
                <UserX className="h-3 w-3" />
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>

          {!file.canDelete && !file.canTrash && !file.isOwnedByUser && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <AlertTriangle className="h-3 w-3" />
              Limited permissions for this file
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdvancedFileManager() {
  const { user } = useAuth();
  const { 
    sharedFiles, 
    largeFiles, 
    loadSharedFiles, 
    loadLargeFiles, 
    loading 
  } = useApp();
  const [activeTab, setActiveTab] = useState<'shared' | 'large'>('shared');
  const [minSize, setMinSize] = useState(100); // MB
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadShared = async () => {
    setIsLoading(true);
    try {
      await loadSharedFiles();
      toast.success('Loaded shared files');
    } catch (error) {
      toast.error('Failed to load shared files');
      console.error('Error loading shared files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadLarge = async () => {
    setIsLoading(true);
    try {
      await loadLargeFiles(minSize * 1024 * 1024); // Convert MB to bytes
      toast.success(`Loaded files larger than ${minSize}MB`);
    } catch (error) {
      toast.error('Failed to load large files');
      console.error('Error loading large files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please log in to access advanced file management</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Advanced File Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === 'shared' ? 'default' : 'outline'}
              onClick={() => setActiveTab('shared')}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Shared Files
            </Button>
            <Button
              variant={activeTab === 'large' ? 'default' : 'outline'}
              onClick={() => setActiveTab('large')}
              className="flex items-center gap-2"
            >
              <HardDrive className="h-4 w-4" />
              Large Files
            </Button>
          </div>

          {activeTab === 'shared' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files Shared with You</h3>
                <Button
                  onClick={handleLoadShared}
                  disabled={isLoading || loading}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  {isLoading ? 'Loading...' : 'Load Shared Files'}
                </Button>
              </div>

              {sharedFiles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {sharedFiles.map((file) => (
                    <FileActions key={file.fileid} file={file} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No shared files loaded. Click &quot;Load Shared Files&quot; to fetch files shared with you.
                </p>
              )}
            </div>
          )}

          {activeTab === 'large' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-medium">Large Files</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Min size (MB):</label>
                  <input
                    type="number"
                    value={minSize}
                    onChange={(e) => setMinSize(parseInt(e.target.value) || 100)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                    max="10000"
                  />
                  <Button
                    onClick={handleLoadLarge}
                    disabled={isLoading || loading}
                    className="flex items-center gap-2"
                  >
                    <HardDrive className="h-4 w-4" />
                    {isLoading ? 'Loading...' : 'Load Large Files'}
                  </Button>
                </div>
              </div>

              {largeFiles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {largeFiles.map((file) => (
                    <FileActions key={file.fileid} file={file} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No large files loaded. Click &quot;Load Large Files&quot; to fetch files over {minSize}MB.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
