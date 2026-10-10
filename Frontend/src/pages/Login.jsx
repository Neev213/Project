import { Link } from "react-router-dom";

export default function Login() {
    return (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4 text-white">
            <h1 className="text-3xl">Login page</h1>
            <Link to="/" className="underline">Back to landing</Link>
        </div>
    )
}