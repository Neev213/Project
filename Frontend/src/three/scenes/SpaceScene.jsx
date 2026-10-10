import Stars from "../objects/Stars";
import Earth from "../objects/Earth";
import Sun from "../objects/Sun";
import Moon from "../objects/Moon";

export default function SpaceScene() {
    return (
        <>
            <Stars />
            <Earth />
            <Moon/>
            <Sun />
        </>
    )
}