import FilesTree from './components/FilesTree';
import { useParams } from 'react-router-dom';
import { useGetTreeQuery } from './api';
import { useGetHighlightsQuery, useGetRedactionsQuery } from '@/features/toolbar/api';
import { normalizeBundleId } from '@/lib/bundleId';

const FileTree: React.FC = () => {
  const { bundleId: routeBundleId } = useParams<{ bundleId: string }>();
  const bundleId = normalizeBundleId(routeBundleId);

  // Results flow into the slice via addMatcher — no manual dispatch needed
  useGetTreeQuery(bundleId ?? '', {
    skip: !bundleId,
    refetchOnMountOrArgChange: true,
  });

  useGetHighlightsQuery(bundleId ?? '', {
    skip: !bundleId,
    refetchOnMountOrArgChange: true,
  });

  useGetRedactionsQuery(bundleId ?? '', {
    skip: !bundleId,
    refetchOnMountOrArgChange: true,
  });

  return (
    <div className="h-full w-full bg-white text-gray-800">
      <div className="py-1 overflow-y-auto">
        <FilesTree />
      </div>
    </div>
  );
};

export default FileTree;
