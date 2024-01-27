export interface StandardResponse {
    Username: string;
    NotificationType: string;
    Message: string;
    Timestamp: string;
}

export interface PlaybacksResponse {
    media: string;
    directplay: boolean;
    IsVideoDirect?: boolean;
    IsAudioDirect?: boolean;
    CompletionPercentage?: number;
}