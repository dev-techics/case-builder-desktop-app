import { toast } from 'react-toastify';
import type { CreateBundleDto } from '../api/bundlesApi';
import { useCreateBundleMutation } from '../api';

export type CreateBundleFormData = Pick<
  CreateBundleDto,
  'bundleName' | 'caseNumber' | 'description'
>;

export const useCreateBundle = () => {
  const [createBundle] = useCreateBundleMutation();

  const createBundleHandler = async (formData: CreateBundleFormData) => {
    try {
      await createBundle(formData).unwrap();
      toast.success('New bundle created successfully');
    } catch (error) {
      toast.error('Failed to create bundle');
    }
  };

  return { createBundle: createBundleHandler };
};
