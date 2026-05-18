export default async function handler(req, res) {
    // Pengaturan Header CORS agar aman
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // 1. Tangkap ID video yang dikirim secara dinamis dari yt.js
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ status: false, message: "ID video diperlukan" });
    }

    try {
        // 2. UBAH DI SINI: Masukkan variabel id ke dalam endpoint API Converter Anda
        // Ganti URL di bawah ini dengan base URL API converter Anda yang asli, lalu selipkan ${id} di ujungnya
        const response = await fetch(`https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D_Pr1SYtNYsU&format=mp3?id=${id}`); 
        const data = await response.json();

        // Kirim hasil data mp3 segar dari converter ke frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error("Converter Error:", error);
        
        // Fallback otomatis menggunakan direct link stream cadangan jika API utama sedang sibuk
        return res.status(200).json({
            status: true,
            result: {
                id: id,
                title: "Streaming Audio",
                // Menggunakan ID asli agar file mp3 yang dihasilkan bervariasi sesuai lagu yang diklik
                download: `https://cdn406.savetube.vip/media/${id}/stream.mp3` 
            }
        });
    }
}
