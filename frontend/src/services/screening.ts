export async function screenVideo(file: File) {
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/screening/screen`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Screening failed");
  }

  return res.json();
}
