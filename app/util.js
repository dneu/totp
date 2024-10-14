// work regardless of the time of day
const override=false;
export const accessibleHours = [8, 12, 18, 21];

export function secsRemaining(){
    return 30-new Date().getSeconds()%30;
}

export async function isAccessible(){
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    console.log('hour, min: ' + hour + ',' + minute);
    console.log('is accessible: ' +(accessibleHours.includes(hour) && minute < 30))
    console.log('override: ' +(override))

    return (accessibleHours.includes(hour) && minute < 30) || override;
}