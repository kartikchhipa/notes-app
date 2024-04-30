import Image from "next/image";
import styles from "./page.module.css";

// use the Notes component
import NotesArea from "./Notes";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <NotesArea />
      </div>
    </main>
  );
}
