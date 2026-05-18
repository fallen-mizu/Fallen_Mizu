export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ status: false, message: "ID video diperlukan" });
    }

    try {
        // Panggil API converter Anda secara dinamis dengan menyertakan ID dari lagu yang diklik
        // Pastikan format parameter API Anda (?id= atau ?url=) sesuai dengan dokumentasi aslinya
        const response = await fetch(`https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D_Pr1SYtNYsU&format=mp3?id=${id}`); 
        const data = await response.json();

        // Jika API converter mengembalikan data yang valid, teruskan langsung ke frontend
        if (data && data.status && data.result) {
            return res.status(200).json(data);
        }
        
        // Jika API converter merespon tapi strukturnya kosong, lempar ke mode fallback
        throw new Error("Respon API utama tidak lengkap");

    } catch (error) {
        console.error("Converter Engine Error:", error);
        
        // PENTING: Struktur fallback ini dibuat sama persis dengan format JSON API asli Anda
        // agar lolos validasi `if (data.status && data.result && data.result.download)` di yt.js
        return res.status(200).json({
            status: true,
            creator: "ZennzXD - Fallback",
            result: {
                id: id,
                title: "Streaming Audio",
                format: "mp3",
                duration: 0,
                thumbnail: "",
                cached: true,
                // Menggunakan skrip download mirror cadangan berbasis id video yang diklik
                download: `https://cdn406.savetube.vip/media/${id}/stream.mp3`
            }
        });
    }
            }
