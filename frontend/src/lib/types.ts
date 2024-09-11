export interface DefaultDialogProps {
    open: boolean;
    onClose: () => void;
}

export interface MembershipDTO {
    id: string;
    title: string;
    amount: string;
    active: boolean;
}