export default function Words({ text, show, className = '' }) {
    return (
        <h2 className={className}>
        {text.split(' ').map((word, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
            <span
                className={`inline-block transition-all duration-700 ease-out ${
                show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}
                style={{ transitionDelay: show ? `${i * 80}ms` : '0ms' }}
            >
                {word}&nbsp;
            </span>
            </span>
        ))}
        </h2>
    )
}