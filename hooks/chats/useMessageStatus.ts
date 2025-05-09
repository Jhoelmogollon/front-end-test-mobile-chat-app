import { Message } from "./useChats";
import { useCallback } from "react";
import { STATUS_ICONS } from "@/constants/messageStatus";

export function useMessageStatus(message: Message, isCurrentUser: boolean) {

    const getStatusIcon = useCallback(() => {
        if(!isCurrentUser) return null;
        return STATUS_ICONS[message.status];
    }, [message.status, isCurrentUser]);
    
    return {
        getStatusIcon,
        shouldShowStatus: isCurrentUser
    }
}
