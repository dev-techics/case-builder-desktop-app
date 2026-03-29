/**
 * New bundle Creation dialog
 *
 * Responsibility:
 * Display the dialog collect the data and dispatch the action
 *
 * Notes:
 *
 * Author: Anik Dey
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, type FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBundle } from '../hooks';
import type { CreateBundleFormData } from '../hooks';

interface CreateNewBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateNewBundleDialog = ({
  open,
  onOpenChange,
}: CreateNewBundleDialogProps) => {
  const [formData, setFormData] = useState<CreateBundleFormData>({
    bundleName: '',
    caseNumber: '',
    description: '',
  });

  const { createBundle } = useCreateBundle();

  // Handle new bundle creation
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createBundle(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Bundle</DialogTitle>
          <DialogDescription>
            Enter the details for your new bundle. Click create when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={e => handleSubmit(e)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="bundle-name">Bundle Name *</Label>
              <Input
                id="bundle-name"
                name="bundleName"
                value={formData.bundleName}
                onChange={e =>
                  setFormData({ ...formData, bundleName: e.target.value })
                }
                placeholder="e.g., Smith v. Johnson - Discovery"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="case-number">Case Number *</Label>
              <Input
                id="case-number"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={e =>
                  setFormData({ ...formData, caseNumber: e.target.value })
                }
                placeholder="e.g., CV-2024-001234"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="case-number">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description for the bundle"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="default" type="submit">
              Create Bundle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewBundleDialog;
