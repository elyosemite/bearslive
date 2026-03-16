import { useEffect, useState } from "react";
import styles from './Father.module.css';

const names = [
    'Alice',
    'Bob',
    'Charlie',
    'David',
    'Eve',
    'Frank',
    'Grace',
    'Heidi',
    'Ivan',
    'Judy'];

export function Son() {
    const [sonName, setSonName] = useState(names[Math.floor(Math.random() * names.length)]);
    return (
        <div>
            <h1>
                Hello, my name is
                <span className={styles["highlight-text"]}> {sonName}</span>
                <button onClick={() => setSonName(names[Math.floor(Math.random() * names.length)])}>
                    Change Son Name
                </button>
            </h1>
        </div>
    )
};

interface FatherProps {
    children: React.ReactNode;
}

export default function Father(props: FatherProps) {
    const [fatherName, setFatherName] = useState(names[Math.floor(Math.random() * names.length)]);

    useEffect(() => {
        console.log(`Father component with name ${fatherName} has mounted or updated.`);
        // create a cleanup function to log when the component unmounts
        return () => {
            console.log(`Father component with name ${fatherName} is unmounting...`);
        }
    }, [fatherName]);

    return (
        <div>
            <h1>
                Hello, my name is
                <span className={styles["highlight-text"]}> {fatherName} </span>
            </h1>
            <button onClick={() => setFatherName(names[Math.floor(Math.random() * names.length)])}>
                Change Father Name
            </button>
            {props.children}
        </div>
    )
}