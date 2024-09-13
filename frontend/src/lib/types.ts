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

export interface ACSKeyDTO {
    id: string;
    name: string;
    type: "pan" | "uid";
    key: string;
}

export interface MemberDTO {
    id: string;
    name: string;
    email: string;
    githubMetadata?: {
        githubUsername: string;
    },
    telegramMetadata?: {
        telegramId: string;
    }
}

export interface SpaceTransactionDTO {
    id: string;
    type: "deposit" | "withdrawal";
    amount: string;
    comment?: string;
    date: string;
    source?: "magic" | "donate" | "topup";
    target?: "magic" | "basic" | "purchases";
    actor: MemberDTO;
    createdAt: string;
}

export interface MemberTransactionDTO {
    id: string;
    type: "deposit" | "withdrawal";
    amount: string;
    comment?: string;
    date: string;
    source?: "magic" | "donate" | "topup";
    target?: "magic" | "membership";
    subject: MemberDTO;
    actor: MemberDTO;
    createdAt: string;
}