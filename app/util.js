// work regardless of the time of day
const override=false;
export const accessibleHours = [8, 12, 18, 21];

export function secsRemaining(){
    return 30-new Date().getSeconds()%30;
}

export function isAccessible(){
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const accessible = (accessibleHours.includes(hour) && minute < 30) || override;
    return accessible;
}

export function lockoutExplain(){
    return "2FA codes are only accessible for 30 minutes after 8 am, 12 pm, 6 pm and 9 pm."
}