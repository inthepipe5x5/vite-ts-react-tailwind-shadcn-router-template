import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TaskScheduleViewItem } from '@/data/emar-types';

interface CompleteTaskModalProps {
    item: TaskScheduleViewItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: {
        schedule_id: string;
        pet_id: string;
        delivered_amount_value: number;
        delivered_amount_unit: string;
        user_comment: string;
    }) => void;
    isSubmitting: boolean;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
    item,
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}) => {

    const [amountValue, setAmountValue] = useState<number>(
        item.expected_amount_value ?? 1
    );
    const [amountUnit, setAmountUnit] = useState<string>(
        item.expected_amount_unit ?? 'tabs'
    );
    const [comment, setComment] = useState<string>('');
    
    if (!item) return null; //TODO: Handle this case better, maybe show a message or disable the modal

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            schedule_id: item.schedule_id,
            pet_id: item.pet_id,
            delivered_amount_value: amountValue,
            delivered_amount_unit: amountUnit,
            user_comment: comment,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Administer Task: {item.task_title}</DialogTitle>
                    <DialogDescription>
                        Pet: <span className="font-semibold text-foreground">{item.pet_name}</span> |
                        Scheduled for {new Date(item.due_on).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="amount_value">Delivered Amount</Label>
                            <Input
                                id="amount_value"
                                type="number"
                                step="0.01"
                                required
                                value={amountValue}
                                onChange={(e) => setAmountValue(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="amount_unit">Unit</Label>
                            <Input
                                id="amount_unit"
                                type="text"
                                required
                                placeholder="e.g. ml, mg, tabs"
                                value={amountUnit}
                                onChange={(e) => setAmountUnit(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="user_comment">Admin Notes / Remarks</Label>
                        <Textarea
                            id="user_comment"
                            placeholder="e.g. Administered with evening kibble. Pet accepted well."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Recording...' : 'Confirm Administration'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};