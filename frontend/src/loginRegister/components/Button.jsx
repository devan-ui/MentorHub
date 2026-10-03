const Button = ({ onClick, data, type = "submit" }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className="
                w-full
                h-12
                rounded-xl
                bg-green-600
                text-white
                font-semibold
                shadow-md
                transition-all
                duration-300
                hover:bg-green-700
                hover:shadow-lg
                active:scale-[0.98]
                focus:outline-none
                focus:ring-4
                focus:ring-green-200
            "
        >
            {data}
        </button>
    );
};

export default Button;

