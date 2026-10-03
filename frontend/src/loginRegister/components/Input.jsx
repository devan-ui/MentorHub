
const Input = ({
    data,
    setData,
    ofType,
    placeholder,
}) => {
    return (
        <input
            type={ofType}
            value={data}
            placeholder={placeholder}
            onChange={(e) => setData(e.target.value)}
            className="
                w-full
                h-12
                px-4
                rounded-xl
                border
                border-gray-300
                bg-gray-50
                text-gray-800
                placeholder:text-gray-400
                outline-none
                transition-all
                duration-300
                focus:bg-white
                focus:border-green-600
                focus:ring-4
                focus:ring-green-100
                hover:border-gray-400
            "
        />
    );
};

export default Input;

