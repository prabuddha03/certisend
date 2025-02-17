import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function CreateUpdateDialog({ open, onOpenChange, onSubmit }: CreateUpdateDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('update');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, type });
    setTitle('');
    setContent('');
    setType('update');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-zinc-950 border border-zinc-800">
        <DialogHeader>
          <DialogTitle>Create New Update</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="announcement" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">
                  Announcement
                </SelectItem>
                <SelectItem value="update" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">
                  Update
                </SelectItem>
                <SelectItem value="reminder" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">
                  Reminder
                </SelectItem>
                <SelectItem value="result" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">
                  Result
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content"
              required
              rows={5}
              className="bg-zinc-900 border-zinc-800 min-h-[120px]"
            />
          </div>

          <DialogFooter>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 shadow-sm"
            >
              Post Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}