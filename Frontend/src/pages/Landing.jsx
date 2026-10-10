import { Link } from 'react-router-dom'

const sections = ['Hero', 'Weather you can see', 'The sky above your city', 'Your cities', 'Step inside']

export default function Landing() {
    return (
        <div className="relative z-10 text-white">
        {sections.map((title, i) => (
            <section key={title} className="h-screen flex flex-col items-center justify-center gap-6">
            <h2 className="text-4xl font-light">{title}</h2>
            {i === sections.length - 1 && (
                <Link to="/login" className="rounded-full border border-white/40 px-6 py-2">
                Go to login
                </Link>
            )}
            </section>
        ))}
        </div>
    )
}