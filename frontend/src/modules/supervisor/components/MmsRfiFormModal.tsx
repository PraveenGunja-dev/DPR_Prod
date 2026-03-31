import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MmsRfiFormData {
  rfiNo: string;
  subject: string;
  module: string;
  submittedDate: string;
  responseDate: string;
  status: string;
  remarks: string;
}

interface MmsRfiFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MmsRfiFormData) => void;
  initialData?: Partial<MmsRfiFormData>;
}

export function MmsRfiFormModal({ open, onOpenChange, onSubmit, initialData = {} }: MmsRfiFormModalProps) {
  const [formData, setFormData] = useState<MmsRfiFormData>({
    rfiNo: initialData.rfiNo || "",
    subject: initialData.subject || "",
    module: initialData.module || "",
    submittedDate: initialData.submittedDate || "",
    responseDate: initialData.responseDate || "",
    status: initialData.status || "Open",
    remarks: initialData.remarks || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.rfiNo.trim()) {
      newErrors.rfiNo = "RFI No is required";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.module.trim()) {
      newErrors.module = "Module is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);

    // Reset form
    setFormData({
      rfiNo: "",
      subject: "",
      module: "",
      submittedDate: "",
      responseDate: "",
      status: "Open",
      remarks: "",
    });

    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setFormData({
          rfiNo: "",
          subject: "",
          module: "",
          submittedDate: "",
          responseDate: "",
          status: "Open",
          remarks: "",
        });
        setErrors({});
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New MMS / RFI Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="rfiNo" className="text-sm font-medium">
                  RFI No *
                </label>
                <Input
                  id="rfiNo"
                  name="rfiNo"
                  value={formData.rfiNo}
                  onChange={handleInputChange}
                  placeholder="Enter RFI number..."
                  className={errors.rfiNo ? "border-red-500" : ""}
                />
                {errors.rfiNo && <p className="text-sm text-red-500">{errors.rfiNo}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="module" className="text-sm font-medium">
                  Module *
                </label>
                <Input
                  id="module"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  placeholder="Enter module..."
                  className={errors.module ? "border-red-500" : ""}
                />
                {errors.module && <p className="text-sm text-red-500">{errors.module}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject *
              </label>
              <Textarea
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter subject..."
                className={errors.subject ? "border-red-500" : ""}
              />
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="submittedDate" className="text-sm font-medium">
                  Submitted Date
                </label>
                <div className="relative">
                  <Input
                    id="submittedDate"
                    name="submittedDate"
                    type="date"
                    value={formData.submittedDate}
                    onChange={handleInputChange}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="responseDate" className="text-sm font-medium">
                  Response Date
                </label>
                <div className="relative">
                  <Input
                    id="responseDate"
                    name="responseDate"
                    type="date"
                    value={formData.responseDate}
                    onChange={handleInputChange}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={formData.status} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="remarks" className="text-sm font-medium">
                Remarks
              </label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter any remarks..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
