import FileUpload from "../components/FileUpload.tsx";

export default function Home() {
  return (
    <div className="flex min-h-screen w-screen justify-between">
      <div className="w-[30vw] min-h-screen">
        <FileUpload />
      </div>
      <div className="w-[70vw] min-h-screen border-x-2 border-black">Welcome to Next.js!</div>
    </div>
  );
}
