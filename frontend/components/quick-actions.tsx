'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Trash2, 
  UserX, 
  Share2, 
  HardDrive, 
  Loader2,
  ArrowRight
} from 'lucide-react';

export function QuickActions() {
  const { 
    files, 
    unusedFiles, 
    deleteFiles, 
    removeFiles, 
    loadSharedFiles,
    loadLargeFiles,
    deleting,
    removing
  } = useApp();
  
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isLoadingLarge, setIsLoadingLarge] = useState(false);

  const handleBulkDeleteUnused = async () => {
    if (unusedFiles.length === 0) {
      toast.error('No unused files to delete');
      return;
    }

    const ownedUnusedFiles = unusedFiles.filter(file => file.isOwnedByUser && (file.canDelete || file.canTrash));
    
    if (ownedUnusedFiles.length === 0) {
      toast.error('No unused files can be deleted (permission restrictions)');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${ownedUnusedFiles.length} unused files? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const result = await deleteFiles(ownedUnusedFiles.map(f => f.fileid));
      toast.success(`Deleted ${result.deletedCount} unused files`);
    } catch {
      toast.error('Failed to delete unused files');
    }
  };

  const handleBulkRemoveShared = async () => {
    const sharedFiles = files.filter(file => !file.isOwnedByUser);
    
    if (sharedFiles.length === 0) {
      toast.error('No shared files to remove');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${sharedFiles.length} shared files from your view? This will not delete the original files.`
    );
    
    if (!confirmed) return;

    try {
      const result = await removeFiles(sharedFiles.map(f => f.fileid));
      toast.success(`Removed ${result.deletedCount} shared files from your view`);
    } catch {
      toast.error('Failed to remove shared files');
    }
  };

  const handleLoadShared = async () => {
    setIsLoadingShared(true);
    try {
      await loadSharedFiles();
      toast.success('Loaded shared files');
    } catch {
      toast.error('Failed to load shared files');
    } finally {
      setIsLoadingShared(false);
    }
  };

  const handleLoadLarge = async () => {
    setIsLoadingLarge(true);
    try {
      await loadLargeFiles(100 * 1024 * 1024); // 100MB
      toast.success('Loaded large files (>100MB)');
    } catch {
      toast.error('Failed to load large files');
    } finally {
      setIsLoadingLarge(false);
    }
  };

  const sharedFilesCount = files.filter(f => !f.isOwnedByUser).length;
  const deletableUnusedCount = unusedFiles.filter(f => f.isOwnedByUser && (f.canDelete || f.canTrash)).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
      {/* Quick Delete Unused */}
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{deletableUnusedCount}</div>
              <div className="text-xs text-red-300">files</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-red-100 mb-1">Quick Cleanup</h3>
          <p className="text-xs text-red-200/80 mb-4">Delete all unused files you own</p>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDeleteUnused}
            disabled={deleting || deletableUnusedCount === 0}
            className="w-full text-xs bg-red-600 hover:bg-red-700 border-0"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3 h-3 mr-2" />
                Delete {deletableUnusedCount}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Remove Shared */}
      <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <UserX className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{sharedFilesCount}</div>
              <div className="text-xs text-orange-300">shared</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-orange-100 mb-1">Remove Shared</h3>
          <p className="text-xs text-orange-200/80 mb-4">Remove shared files from view</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkRemoveShared}
            disabled={removing || sharedFilesCount === 0}
            className="w-full text-xs text-orange-400 hover:text-orange-300 border-orange-500/40 hover:bg-orange-500/10"
          >
            {removing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Removing...
              </>
            ) : (
              <>
                <UserX className="w-3 h-3 mr-2" />
                Remove {sharedFilesCount}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Load Shared Files */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-blue-100 mb-1">Shared Files</h3>
          <p className="text-xs text-blue-200/80 mb-4">Load files shared with you</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadShared}
            disabled={isLoadingShared}
            className="w-full text-xs text-blue-400 hover:text-blue-300 border-blue-500/40 hover:bg-blue-500/10"
          >
            {isLoadingShared ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 mr-2" />
                Load Shared
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Load Large Files */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-purple-100 mb-1">Large Files</h3>
          <p className="text-xs text-purple-200/80 mb-4">Find space-consuming files (&gt;100MB)</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadLarge}
            disabled={isLoadingLarge}
            className="w-full text-xs text-purple-400 hover:text-purple-300 border-purple-500/40 hover:bg-purple-500/10"
          >
            {isLoadingLarge ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 mr-2" />
                Load Large
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
