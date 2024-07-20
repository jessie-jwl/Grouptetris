"use client";
import Spinner from 'react-bootstrap/Spinner';
import styles from './loading.module.css'

export default function LoadingPage(props: { message: string }) {
    return (
        <div className={styles.container}>
            <h1>{props.message}</h1>
            <Spinner animation= "border" role = "status" >
                <span className="visually-hidden"> Loading...</span>
            </Spinner>
        </div>
    );
}