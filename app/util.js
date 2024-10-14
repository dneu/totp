// work regardless of the time of day
//const override=true;
const accessibleHours = [8, 12, 18, 21];

export function secsRemaining(){
    return 30-new Date().getSeconds()%30;
}

export async function isAccessible(){
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    return (accessibleHours.includes(hour) && minute < 15) || override;
}