import { useState, useEffect, useRef } from 'react'
import { auth, logInWithGoogle, logOut, registerWithEmail, loginWithEmail, db } from './firebase'
import { onAuthStateChanged, updateProfile, } from 'firebase/auth'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import emailjs from '@emailjs/browser'

// ─── KOMPONEN TOAST NOTIFIKASI ────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      role="alert"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up
        ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
    >
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="Tutup notifikasi">✕</button>
    </div>
  )
}

// ─── KOMPONEN BINTANG RATING ──────────────────────────────────────────────────
function RenderBintang({ rating }) {
  return (
    <div className="flex gap-1 mb-2" aria-label={`Rating ${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-[#8A1FFF]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── DATA PAKET HARGA ─────────────────────────────────────────────────────────
const paketHarga = [
  {
    nama: 'Starter',
    harga: 'Rp 1.500.000',
    subtitle: 'Untuk bisnis yang baru memulai',
    warna: 'from-blue-400 to-[#2F7BFF]',
    fitur: [
      'Landing Page 1 halaman',
      'Desain responsif (Mobile-friendly)',
      'Gratis domain .com tahun pertama',
      'Hosting shared server',
      'Form kontak sederhana',
      'Revisi hingga 2x',
    ],
    popular: false,
  },
  {
    nama: 'Professional',
    harga: 'Rp 3.500.000',
    subtitle: 'Paling populer untuk bisnis berkembang',
    warna: 'from-[#2F7BFF] to-[#8A1FFF]',
    fitur: [
      'Multi-halaman (hingga 7 halaman)',
      'Desain custom premium',
      'Gratis domain + Cloud Hosting',
      'Integrasi WhatsApp & Google Maps',
      'Optimasi SEO dasar',
      'Revisi hingga 5x',
      'Dukungan teknis 3 bulan',
    ],
    popular: true,
  },
  {
    nama: 'Enterprise',
    harga: 'Hubungi Kami',
    subtitle: 'Solusi penuh untuk bisnis skala besar',
    warna: 'from-[#8A1FFF] to-purple-900',
    fitur: [
      'Web App / E-Commerce / Sistem Custom',
      'Fitur tak terbatas sesuai kebutuhan',
      'Cloud Server premium + CDN',
      'Integrasi payment gateway',
      'Dashboard admin custom',
      'Revisi unlimited',
      'Dukungan teknis 12 bulan',
    ],
    popular: false,
  },
]

// ─── DATA FAQ ─────────────────────────────────────────────────────────────────
const faqData = [
  {
    tanya: 'Berapa lama proses pembuatan website di VQ Project?',
    jawab: 'Waktu pengerjaan sangat bergantung pada kompleksitas fitur yang Anda minta. Untuk Company Profile standar biasanya memakan waktu 3–7 hari kerja. Sedangkan untuk Toko Online atau Web App memakan waktu 2–4 minggu.',
  },
  {
    tanya: 'Apakah biaya sudah termasuk domain dan hosting?',
    jawab: 'Ya! Semua paket pembuatan website kami sudah mencakup gratis domain (.com / .id dll) dan hosting berkualitas tinggi (Cloud Server) untuk tahun pertama.',
  },
  {
    tanya: 'Apakah ada biaya perpanjangan tahunan?',
    jawab: 'Betul. Mulai tahun kedua, Anda hanya perlu membayar biaya perpanjangan server (hosting) dan nama domain agar website tetap aktif. Kami akan menginformasikan biayanya secara transparan sejak awal kontrak.',
  },
  {
    tanya: 'Mengapa harus memilih VQ Project?',
    jawab: 'Kami tidak sekadar menggunakan template instan. Kami membangun website dengan teknologi modern (seperti React) sehingga sangat cepat, aman, responsif di HP, dan dioptimasi khusus untuk meningkatkan penjualan bisnis Anda.',
  },
  {
    tanya: 'Bagaimana alur kerja proyek di VQ Project?',
    jawab: 'Alur kami sederhana: (1) Konsultasi kebutuhan via WhatsApp/form, (2) Pengiriman proposal & estimasi biaya, (3) DP 50% dan proses desain dimulai, (4) Revisi bersama, (5) Pelunasan dan website live. Transparan dari awal hingga akhir.',
  },
]

// ─── KOMPONEN ANIMASI SCROLL (BARU) ───────────────────────────────────────────
function RevealOnScroll({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true) // Mainkan animasi saat elemen masuk layar
        } else {
          setIsVisible(false) // Reset kembali jadi sembunyi saat elemen keluar dari layar
        }
      },
      { threshold: 0.10 } // Sensitivitas pemicu diturunkan sedikit agar lebih responsif
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 cubic-bezier(0.25, 1, 0.5, 1) transform
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100 filter blur-0' 
          : 'opacity-0 translate-y-8 scale-95 filter blur-[2px]'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
// ═════════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA APP
// ═════════════════════════════════════════════════════════════════════════════
function App() {
  // ── Auth & UI State ────────────────────────────────────────────────────────
  const [user, setUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [jumlahPengunjung, setJumlahPengunjung] = useState(0)
  
  // STATE ROUTING MANUAL
  const [currentPage, setCurrentPage] = useState('landing') // 'landing', 'dashboard', 'privacy', 'terms'
  const [activeSection, setActiveSection] = useState('home')

  // ── Login Form State ───────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [namaRegister, setNamaRegister] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [setujuSyarat, setSetujuSyarat] = useState(false)

  // ── Proyek Form State ──────────────────────────────────────────────────────
  const [namaKlien, setNamaKlien] = useState('')
  const [emailKlien, setEmailKlien] = useState('')
  const [waKlien, setWaKlien] = useState('')
  const [jenisLayanan, setJenisLayanan] = useState('Company Profile')
  const [budget, setBudget] = useState('Rp 1.5 Juta - Rp 3 Juta')
  const [pesanProyek, setPesanProyek] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Ulasan State ───────────────────────────────────────────────────────────
  const [ratingForm, setRatingForm] = useState(5)
  const [teksUlasan, setTeksUlasan] = useState('')
  const [daftarUlasan, setDaftarUlasan] = useState([])
  const [isLoadingUlasan, setIsLoadingUlasan] = useState(true)

  // ── Toast State ────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ── FAQ State ──────────────────────────────────────────────────────────────
  const [activeFaq, setActiveFaq] = useState(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mobileMenuRef = useRef(null)

  // ── Konstanta ──────────────────────────────────────────────────────────────
  const ADMIN_EMAIL = 'muhamadrofiki123@gmail.com'
  const isAdmin = user && user.email === ADMIN_EMAIL

  // ─── Helper: tampilkan toast ───────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // ─── Ambil Ulasan dari Firestore ───────────────────────────────────────────
  const ambilUlasan = async () => {
    setIsLoadingUlasan(true)
    try {
      const q = query(collection(db, 'ulasan'), orderBy('waktu', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setDaftarUlasan(data)
    } catch (error) {
      console.error('Gagal mengambil ulasan:', error)
    } finally {
      setIsLoadingUlasan(false)
    }
  }

  // ─── Effect: Auth listener, scroll listener, ulasan fetch ─────────────────
  useEffect(() => {
    ambilUlasan()
    
    // ── MESIN PENGHITUNG PENGUNJUNG ──
    const catatPengunjung = async () => {
      try {
        const refKunjungan = doc(db, 'statistik', 'kunjungan')
        const snapKunjungan = await getDoc(refKunjungan)
        
        // Jika database belum ada, buat baru mulai dari 1
        if (!snapKunjungan.exists()) {
          await setDoc(refKunjungan, { total: 1 })
          setJumlahPengunjung(1)
          localStorage.setItem('vq_visited', 'true')
        } else {
          // Cek apakah pengunjung ini baru atau cuma refresh halaman
          const sudahPernahMampir = localStorage.getItem('vq_visited')
          if (!sudahPernahMampir) {
            // Jika pengunjung baru, tambah +1 ke database
            await updateDoc(refKunjungan, { total: increment(1) })
            localStorage.setItem('vq_visited', 'true')
            setJumlahPengunjung(snapKunjungan.data().total + 1)
          } else {
            // Jika cuma refresh, tampilkan angka terakhir tanpa menambah
            setJumlahPengunjung(snapKunjungan.data().total)
          }
        }
      } catch (error) {
        console.error("Gagal mencatat pengunjung:", error)
      }
    }
    catatPengunjung()

    // Auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setIsModalOpen(false)
        setEmail('')
        setPassword('')
        setErrorMsg('')
        setEmailKlien(currentUser.email)
      } else {
        setEmailKlien('')
      }
    })

    // Scroll listener: back-to-top & active section
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)

      if (currentPage === 'landing') {
        const sections = ['home', 'tentang', 'layanan', 'harga', 'portofolio', 'ulasan', 'faq', 'kontak']
        for (const id of sections.reverse()) {
          const el = document.getElementById(id)
          if (el && window.scrollY >= el.offsetTop - 120) {
            setActiveSection(id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Tutup mobile menu saat klik di luar
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      unsubscribe()
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [currentPage])

  // ─── Handler: Login / Register Email ──────────────────────────────────────
 // ─── Handler: Login / Register Email ──────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    // --- VALIDASI TAMBAHAN SAAT REGISTER ---
    if (isRegistering) {
      if (password !== konfirmasiPassword) {
        setErrorMsg('Password dan Konfirmasi Password tidak cocok.')
        return
      }
      if (!setujuSyarat) {
        setErrorMsg('Anda harus menyetujui Syarat & Ketentuan VQ Project.')
        return
      }
    }

    try {
      if (isRegistering) {
        await registerWithEmail(email, password)
        // Menyimpan Nama Lengkap ke profil Firebase setelah berhasil daftar
        if (auth.currentUser && namaRegister) {
          await updateProfile(auth.currentUser, { displayName: namaRegister })
          setUser({ ...auth.currentUser, displayName: namaRegister }) // Update tampilan UI langsung
        }
      } else {
        await loginWithEmail(email, password)
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setErrorMsg('Email ini sudah terdaftar. Silakan masuk.')
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') setErrorMsg('Email atau password salah.')
      else if (error.code === 'auth/weak-password') setErrorMsg('Password minimal harus 6 karakter.')
      else if (error.code === 'auth/user-not-found') setErrorMsg('Akun dengan email ini tidak ditemukan.')
      else setErrorMsg('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  // ─── Handler: Kirim Proyek (EmailJS) ──────────────────────────────────────
  const handleKirimProyek = (e) => {
    e.preventDefault()

    // Validasi nomor WA
    const waClean = waKlien.replace(/\D/g, '')
    if (waClean.length < 9 || waClean.length > 15) {
      showToast('Nomor WhatsApp tidak valid. Periksa kembali.', 'error')
      return
    }

    setIsSubmitting(true)

    const templateParams = {
      nama_klien: namaKlien,
      email_klien: emailKlien,
      wa_klien: waKlien,
      jenis_layanan: jenisLayanan,
      budget_proyek: budget,
      pesan_proyek: pesanProyek,
    }

    emailjs
      .send('service_st07n3b', 'template_34glqa3', templateParams, 'MyPz91mIUcpuz43Jh')
      .then(() => {
        showToast('Pesan Anda telah terkirim ke tim VQ Project! Kami akan segera menghubungi Anda.')
        setNamaKlien('')
        if (!user) setEmailKlien('')
        setWaKlien('')
        setPesanProyek('')
        setIsSubmitting(false)
      })
      .catch((error) => {
        console.error('Gagal mengirim:', error)
        showToast('Gagal mengirim pesan. Silakan coba lagi nanti.', 'error')
        setIsSubmitting(false)
      })
  }

  // ─── Handler: Kirim Ulasan ─────────────────────────────────────────────────
  const handleKirimUlasan = async (e) => {
    e.preventDefault()
    if (!user) return
    if (teksUlasan.trim().length < 10) {
      showToast('Ulasan minimal 10 karakter ya.', 'error')
      return
    }
    try {
      await addDoc(collection(db, 'ulasan'), {
        nama: user.displayName || user.email.split('@')[0],
        email: user.email,
        foto: user.photoURL || '',
        rating: ratingForm,
        teks: teksUlasan.trim(),
        waktu: serverTimestamp(),
      })
      showToast('Terima kasih! Ulasan Anda telah diterbitkan.')
      setTeksUlasan('')
      setRatingForm(5)
      ambilUlasan()
    } catch (error) {
      console.error('Gagal mengirim ulasan:', error)
      showToast('Gagal mengirim ulasan. Coba lagi nanti.', 'error')
    }
  }

  // ─── Handler: Hapus Ulasan (Admin) ────────────────────────────────────────
  const handleHapusUlasan = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ulasan ini?')) return
    try {
      await deleteDoc(doc(db, 'ulasan', id))
      ambilUlasan()
      showToast('Ulasan berhasil dihapus.')
    } catch (error) {
      console.error('Gagal menghapus:', error)
      showToast('Gagal menghapus ulasan.', 'error')
    }
  }

  // ─── Handler: Google Login ─────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      await logInWithGoogle()
    } catch (error) {
      setErrorMsg('Gagal login dengan Google. Coba lagi.')
    }
  }

  // ─── Handler: Logout ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logOut()
      setCurrentPage('landing')
      showToast('Anda berhasil keluar.')
    } catch (error) {
      console.error('Gagal logout:', error.message)
    }
  }

  // ─── Routing & Scroll Helper ────────────────────────────────────────────
  const navigateTo = (page, sectionId = null) => {
    setIsMobileMenuOpen(false)
    if (currentPage !== page) {
      setCurrentPage(page)
      window.scrollTo(0, 0)
    }
    if (sectionId) {
      setTimeout(() => { document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    }
  }

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'tentang', label: 'Tentang' },
    { id: 'layanan', label: 'Layanan' },
    { id: 'harga', label: 'Harga' },
    { id: 'portofolio', label: 'Portofolio' },
    { id: 'faq', label: 'FAQ' },
    { id: 'kontak', label: 'Kontak' },
  ]

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white text-[#050505] font-sans relative overflow-x-hidden flex flex-col">

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── 1. NAVBAR GLOBAL ─────────────────────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-blue-950 to-[#8A1FFF] sticky top-0 z-50 shadow-xl" role="navigation" aria-label="Navigasi utama">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* Logo */}
            <button onClick={() => navigateTo('landing', 'home')} className="flex-shrink-0 flex items-center h-full focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Ke halaman utama">
              <img src="/logo.png" alt="VQ Project" className="h-12 md:h-14 w-auto object-contain hover:scale-105 transition-transform duration-300" />
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigateTo('landing', link.id)}
                  className={`font-bold text-sm uppercase tracking-wide focus:outline-none transition-all duration-300 transform hover:scale-105
                    ${currentPage === 'landing' && activeSection === link.id ? 'text-white border-b-2 border-white pb-1' : 'text-white/70 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button onClick={() => navigateTo('dashboard')} className="flex items-center space-x-2 text-left group focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-1">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={`Foto profil ${user.displayName || user.email}`} className={`w-9 h-9 rounded-full border-2 ${currentPage === 'dashboard' ? 'border-[#25D366]' : 'border-white'} group-hover:scale-105 transition`} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#8A1FFF] font-bold text-sm" aria-hidden="true">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white leading-tight group-hover:text-gray-200 transition">{user.displayName || user.email.split('@')[0]}</span>
                      {isAdmin ? <span className="text-[10px] bg-red-500 text-white px-1.5 rounded uppercase font-bold w-max mt-0.5">Admin</span> : <span className="text-[10px] text-[#25D366] font-bold">Masuk/Daftar</span>}
                    </div>
                  </button>
                  <button onClick={handleLogout} className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-bold ml-2 focus:outline-none focus:ring-2 focus:ring-white">
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsModalOpen(true); setErrorMsg('') }}
                  className="bg-white text-[#8A1FFF] px-6 py-2 rounded-full hover:shadow-md hover:bg-gray-100 transition text-sm font-bold hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Masuk/Daftar
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-3">
              {user && (
                <button onClick={() => { navigateTo('dashboard'); setIsMobileMenuOpen(false) }} className="focus:outline-none focus:ring-2 focus:ring-white rounded-full">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="Profil" className="w-8 h-8 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
                    : <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8A1FFF] font-bold text-xs">{user.email.charAt(0).toUpperCase()}</div>
                  }
                </button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                className="text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-4 pt-2 pb-4 space-y-1 bg-blue-950/90 backdrop-blur-sm">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigateTo('landing', link.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition
                  ${currentPage === 'landing' && activeSection === link.id ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/20">
              {user ? (
                <div className="space-y-2">
                  <button onClick={() => navigateTo('dashboard')} className="w-full text-left py-2 px-4 text-white font-bold text-sm">Masuk Dashboard Klien →</button>
                  <button onClick={handleLogout} className="w-full text-sm bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition">Logout</button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsModalOpen(true); setErrorMsg(''); setIsMobileMenuOpen(false) }}
                  className="w-full bg-white text-[#8A1FFF] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition"
                >
                  Masuk/Daftar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* ── BUNGKUSAN ANIMASI HALAMAN (Trik React Key) ──────────────────── */}
      <div key={currentPage} className="flex-grow animate-fade-in-up duration-700">
      </div>

      {/* ── MODAL LOGIN ───────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md relative border border-gray-200 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#8A1FFF] rounded"
              aria-label="Tutup modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 id="modal-title" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] mb-1 text-center">
              {isRegistering ? 'Buat Akun Baru' : 'Selamat Datang di VQ Project'}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              {isRegistering ? 'Daftar untuk membuat akun Client Portal' : 'Masuk ke panel klien eksklusif'}
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
              {errorMsg && (
                <div role="alert" className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              {/* Input Nama (Hanya Muncul Saat Mendaftar) */}
              {isRegistering && (
                <div>
                  <label htmlFor="reg-nama" className="block text-sm font-bold text-[#050505] mb-1">Nama Lengkap / Perusahaan</label>
                  <input id="reg-nama" type="text" required value={namaRegister} onChange={(e) => setNamaRegister(e.target.value)} placeholder="Nama Lengkapmu" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none transition bg-[#F2F2F2] focus:bg-white text-[#050505]" />
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-sm font-bold text-[#050505] mb-1">Email</label>
                <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@anda.com" autoComplete="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none transition bg-[#F2F2F2] focus:bg-white text-[#050505]" />
              </div>
              
              <div>
                <label htmlFor="login-password" className="block text-sm font-bold text-[#050505] mb-1">Password</label>
                <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isRegistering ? 'new-password' : 'current-password'} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none transition bg-[#F2F2F2] focus:bg-white text-[#050505]" />
                {isRegistering && <p className="text-[10px] text-gray-400 mt-1">Minimal 6 karakter.</p>}
              </div>

              {/* Input Konfirmasi Password & Checkbox T&C (Hanya Muncul Saat Mendaftar) */}
              {isRegistering && (
                <>
                  <div>
                    <label htmlFor="login-password-confirm" className="block text-sm font-bold text-[#050505] mb-1">Konfirmasi Password</label>
                    <input id="login-password-confirm" type="password" required value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none transition bg-[#F2F2F2] focus:bg-white text-[#050505]" />
                  </div>
                  <div className="flex items-start mt-2">
                    <input id="terms" type="checkbox" checked={setujuSyarat} onChange={(e) => setSetujuSyarat(e.target.checked)} className="mt-1 h-4 w-4 text-[#8A1FFF] focus:ring-[#8A1FFF] border-gray-300 rounded cursor-pointer" />
                    <label htmlFor="terms" className="ml-2 block text-xs text-gray-600 cursor-pointer">
                      Saya menyetujui <span className="text-[#8A1FFF] font-bold hover:underline" onClick={(e) => { e.preventDefault(); navigateTo('terms'); setIsModalOpen(false); }}>Syarat & Ketentuan</span> yang berlaku di VQ Project.
                    </label>
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white font-bold py-3 rounded-xl hover:shadow-md transition mt-2 focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]">
                {isRegistering ? 'Daftar Sekarang' : 'Masuk Portal'}
              </button>
            </form>
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-400">Atau</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-[#050505] font-bold py-2.5 rounded-xl hover:bg-[#F2F2F2] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-11 0-.746-.08-1.32-.176-1.895H12.24z"/></svg>
              <span>Masuk dengan Google</span>
            </button>
            <p className="text-center text-xs text-gray-600 mt-5">
              {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
              <button
                onClick={() => { setIsRegistering(!isRegistering); setErrorMsg('') }}
                className="text-[#8A1FFF] font-bold hover:underline focus:outline-none"
              >
                {isRegistering ? 'Masuk di sini' : 'Daftar di sini'}
              </button>
            </p>
          </div>
        </div>
      )}
      
      {/* ═════════════════════════════════════════════════════════════════════════
          HALAMAN 1: LANDING PAGE (BERANDA)
      ═════════════════════════════════════════════════════════════════════════ */}
      {currentPage === 'landing' && (
        <main key="landing" className="flex-grow animate-fade-in-up duration-700">
          {/* ── HERO SECTION ───────────────────────────────────────────────── */}
          <section id="home" className="pt-6 pb-16 md:pt-10 md:pb-24 bg-[#F2F2F2] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-[#2F7BFF]/10 to-[#8A1FFF]/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4 pointer-events-none" aria-hidden="true"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                <RevealOnScroll>
              <div className="text-center md:text-left">
                <span className="inline-block bg-white text-[#8A1FFF] px-5 py-1.5 rounded-full text-[10px] font-bold mb-4 tracking-wider uppercase border border-gray-200 shadow-sm">
                  Inovasi Digital oleh VQ Project
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#050505] leading-tight mb-5">
                  <span className="text-mask-wrapper mr-3">
                    <span className={activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} style={{ animationDelay: '100ms' }}>Bantu</span>
                  </span>
                  <span className="text-mask-wrapper mr-3">
                    <span className={activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} style={{ animationDelay: '250ms' }}>Bisnis</span>
                  </span>
                  <br className="hidden md:block" />
                  <span className="text-mask-wrapper mr-3">
                    <span className={activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} style={{ animationDelay: '400ms' }}>Tumbuh</span>
                  </span>
                  <span className="text-mask-wrapper mr-3">
                    <span className={activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} style={{ animationDelay: '550ms' }}>Dengan</span>
                  </span>
                  <br />
                  <span className="text-mask-wrapper">
                    <span className={`${activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} text-transparent bg-clip-text bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF]`} style={{ animationDelay: '700ms' }}>
                      Website
                    </span>
                  </span>
                  <span className="text-mask-wrapper ml-3">
                    <span className={`${activeSection === 'home' ? 'animate-text-mask' : 'opacity-0'} text-transparent bg-clip-text bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF]`} style={{ animationDelay: '850ms' }}>
                      Profesional
                    </span>
                  </span>
                </h1>

                <p className="max-w-md mx-auto md:mx-0 text-base text-gray-600 mb-8">
                  Kami membangun website yang cepat, responsif, dan didesain khusus untuk meningkatkan penjualan serta kepercayaan pelanggan Anda menggunakan teknologi terbaru.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => navigateTo('landing', 'kontak')}
                    className="animate-goyang bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg transition text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]"
                  >
                    🚀 Mulai Proyek Anda
                  </button>
                  <button
                    onClick={() => navigateTo('landing', 'harga')}
                    className="bg-white border-2 border-[#8A1FFF] text-[#8A1FFF] px-8 py-3.5 rounded-full font-bold hover:bg-[#8A1FFF]/5 transition text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]"
                  >
                    Lihat Harga
                  </button>
                </div>
                {/* Social proof mini stats */}
                <div className="flex gap-6 mt-8 justify-center md:justify-start">
                  {[['50+', 'Proyek Selesai'], ['100%', 'Klien Puas'], ['3 Tahun', 'Berpengalaman']].map(([val, label]) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF]">{val}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
                <div className="relative mt-8 md:mt-0 max-w-lg mx-auto md:max-w-none">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#2F7BFF] to-[#8A1FFF] rounded-3xl transform rotate-3 scale-105 opacity-20 pointer-events-none" aria-hidden="true"></div>
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                    alt="Dashboard analitik website profesional VQ Project"
                    className="relative z-10 w-full h-auto rounded-3xl shadow-xl border-4 border-white object-cover animate-float"
                    loading="eager"
                  />
                  <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3 z-20" aria-hidden="true">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2F7BFF] to-[#8A1FFF] rounded-full flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold leading-tight">Kualitas</p>
                      <p className="text-sm text-[#050505] font-extrabold leading-tight">Terjamin</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── TECH STACK (BARU) ────────────────────────────────────────────── */}
          <section className="py-8 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mb-6">Dibangun Dengan Teknologi Modern Terbaik</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-lg font-bold flex items-center gap-2 hover:text-[#61DAFB] transition-colors"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22.54A10.54 10.54 0 1122.54 12 10.55 10.55 0 0112 22.54zm0-19.58a9.04 9.04 0 109.04 9.04A9.05 9.05 0 0012 2.96z"/><ellipse cx="12" cy="12" rx="2.2" ry="2.2"/><path d="M12 16.3c-2.94 0-5.71-1.32-7.5-3.54a1.1 1.1 0 010-1.52A10.15 10.15 0 0112 7.7c2.94 0 5.71 1.32 7.5 3.54a1.1 1.1 0 010 1.52A10.15 10.15 0 0112 16.3zm0-7.1c-2.18 0-4.22.95-5.59 2.5a8.68 8.68 0 0111.18 0c-1.37-1.55-3.41-2.5-5.59-2.5z"/></svg> React</span>
                <span className="text-lg font-bold flex items-center gap-2 hover:text-[#FFCC00] transition-colors"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.98 2.05L2.57 5.73l1.86 11.23L11.98 22l7.55-5.04 1.86-11.23z"/></svg> Firebase</span>
                <span className="text-lg font-bold flex items-center gap-2 hover:text-[#38BDF8] transition-colors"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 4.79L3.45 10l8.56 5.2 8.54-5.2z"/><path d="M12.01 19.21l-8.56-5.2v2.33l8.56 5.2 8.54-5.2v-2.33z"/></svg> Tailwind CSS</span>
                <span className="text-lg font-bold flex items-center gap-2 hover:text-[#646CFF] transition-colors"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3l9.88 17.65L22 3H2z"/></svg> Vite</span>
              </div>
            </div>
          </section>

          {/* ── TENTANG KAMI (BARU) ─────────────────────────────────────────── */}
          <section id="tentang" className="py-20 bg-[#F2F2F2]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="text-[#8A1FFF] font-bold text-xs uppercase tracking-widest block mb-2">Tentang Kami</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-6">Cerita di Balik VQ Project</h2>
              <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-200 text-left md:text-center">
                <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
                  VQ Project didirikan dan berkembang di <strong>Jember, Jawa Timur</strong>, dengan satu misi sederhana: membantu bisnis lokal hingga perusahaan skala nasional untuk memiliki identitas digital yang kredibel, kuat, dan modern.
                </p>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Bagi kami, website bukanlah sekadar kumpulan baris kode. Website adalah gerbang utama yang merepresentasikan kepercayaan, profesionalisme, dan sarana komunikasi tanpa batas antara Anda dengan jutaan pelanggan di luar sana.
                </p>
              </div>
            </div>
          </section>

          {/* ── LAYANAN ────────────────────────────────────────────── */}
          <section id="layanan" className="py-16 bg-white relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-3">Layanan Unggulan Kami</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-base">Solusi digital komprehensif yang disesuaikan dengan kebutuhan dan skala bisnis Anda.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0119-9" />,
                    judul: 'Company Profile',
                    deskripsi: 'Website elegan untuk membangun kredibilitas perusahaan. Cocok untuk agensi, firma, dan bisnis profesional.',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
                    judul: 'Toko Online (E-Commerce)',
                    deskripsi: 'Sistem keranjang belanja otomatis terintegrasi dengan pembayaran dan perhitungan ongkos kirim.',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
                    judul: 'Web App & Sistem Khusus',
                    deskripsi: 'Pembuatan aplikasi berbasis web seperti sistem manajemen inventaris, kasir, atau dashboard admin custom.',
                  },
                ].map((item) => (
                  <div key={item.judul} className="p-6 md:p-8 bg-[#F2F2F2] rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 group hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2F7BFF] to-[#8A1FFF] rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform" aria-hidden="true">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#050505] mb-2">{item.judul}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.deskripsi}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── HARGA KEMBALI FULL SESUAI KODE USER ───────────────────────────── */}
          <section id="harga" className="py-16 bg-[#F2F2F2] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-3">Paket Harga Transparan</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-base">Pilih paket yang sesuai kebutuhan bisnis Anda. Tidak ada biaya tersembunyi.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {paketHarga.map((paket) => (
                  <div
                    key={paket.nama}
                    className={`relative rounded-3xl overflow-hidden flex flex-col border transition-all duration-300
                      ${paket.popular
                        ? 'border-[#8A1FFF] shadow-2xl shadow-[#8A1FFF]/20 scale-105'
                        : 'border-gray-200 shadow-sm hover:shadow-lg bg-white'}`}
                  >
                    {paket.popular && (
                      <div className="bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white text-center py-2 text-xs font-bold tracking-widest uppercase">
                        ⭐ Paling Populer
                      </div>
                    )}
                    <div className={`p-6 md:p-8 flex flex-col flex-1 ${paket.popular ? 'bg-white' : ''}`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${paket.warna} mb-4 shadow-md`} aria-hidden="true">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-extrabold text-[#050505] mb-1">{paket.nama}</h3>
                      <p className="text-gray-500 text-xs mb-4">{paket.subtitle}</p>
                      <p className={`text-2xl md:text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r ${paket.warna}`}>
                        {paket.harga}
                      </p>
                      <ul className="space-y-2.5 mb-8 flex-1">
                        {paket.fitur.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setJenisLayanan(
                            paket.nama === 'Starter' ? 'Company Profile'
                            : paket.nama === 'Professional' ? 'Toko Online'
                            : 'Web App / Sistem Custom'
                          )
                          navigateTo('landing', 'kontak')
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]
                          ${paket.popular
                            ? 'bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white hover:shadow-lg hover:shadow-[#8A1FFF]/30'
                            : 'bg-[#F2F2F2] text-[#050505] hover:bg-gray-200 border border-gray-300'}`}
                      >
                        {paket.nama === 'Enterprise' ? 'Hubungi Kami' : 'Pilih Paket Ini'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-6">* Harga dapat berbeda tergantung kompleksitas proyek. Konsultasi gratis tersedia.</p>
            </div>
          </section>

          {/* ── PORTOFOLIO FULL KEMBALI ─────────────────────────────────────────── */}
          <section id="portofolio" className="py-16 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-3">Karya Terbaik VQ Project</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-base">Beberapa contoh proyek yang telah kami selesaikan dengan teknologi modern.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2370&auto=format&fit=crop',
                    alt: 'Mockup Aplikasi POS Kasir Modern',
                    tag: 'Web App',
                    tagColor: 'text-[#8A1FFF]',
                    judul: 'Aplikasi POS Kasir Modern',
                    deskripsi: 'Sistem Point of Sale berbasis web dengan fitur manajemen stok, keranjang belanja, dan cetak struk otomatis.',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop',
                    alt: 'Mockup Website Corporate Elegan',
                    tag: 'Corporate',
                    tagColor: 'text-[#2F7BFF]',
                    judul: 'Website Corporate Elegan',
                    deskripsi: 'Desain website responsif untuk perusahaan dengan fokus pada kecepatan akses dan optimasi mesin pencari (SEO).',
                  },
                ].map((item) => (
                  <div key={item.judul} className="bg-[#F2F2F2] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200 group">
                    <div className="h-56 relative overflow-hidden bg-gray-200">
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center')
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                      <div className={`absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold ${item.tagColor} shadow-sm z-10`}>{item.tag}</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#050505] mb-1">{item.judul}</h3>
                      <p className="text-gray-600 text-sm">{item.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ULASAN FULL KEMBALI ─────────────────────────────────────────────── */}
          <section id="ulasan" className="py-16 bg-[#F2F2F2] relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-3">Apa Kata Klien Kami</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-base">Kepercayaan dan kepuasan klien adalah prioritas utama VQ Project.</p>
              </div>

              {/* Daftar ulasan */}
              {isLoadingUlasan ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-white rounded-3xl border border-gray-200 animate-pulse">
                      <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 rounded-full" />)}</div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                      <div className="h-3 bg-gray-200 rounded mb-5 w-3/5"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {daftarUlasan.length > 0 ? (
                    daftarUlasan.map((ulasan) => (
                      <div key={ulasan.id} className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
                        {isAdmin && (
                          <button
                            onClick={() => handleHapusUlasan(ulasan.id)}
                            aria-label={`Hapus ulasan dari ${ulasan.nama}`}
                            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 bg-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        <div>
                          <RenderBintang rating={ulasan.rating} />
                          <p className="text-gray-600 italic mb-5 leading-relaxed text-sm">"{ulasan.teks}"</p>
                        </div>
                        <div className="flex items-center gap-3 mt-auto">
                          {ulasan.foto ? (
                            <img src={ulasan.foto} alt={`Foto profil ${ulasan.nama}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] flex items-center justify-center text-white font-bold shadow-sm uppercase text-sm" aria-hidden="true">
                              {ulasan.nama.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-[#050505] text-sm">{ulasan.nama}</h4>
                            <p className="text-[10px] text-gray-500 font-medium">Klien VQ Project</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 bg-white rounded-3xl border border-dashed border-gray-300">
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      <p className="text-gray-500 text-sm">Belum ada ulasan saat ini. Jadilah yang pertama!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Form ulasan */}
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-[#050505] mb-1 text-center">Bagaimana Pengalaman Anda?</h3>
                <p className="text-gray-500 text-center mb-5 text-xs">Bantu kami menjadi lebih baik dengan memberikan ulasan.</p>

                {user ? (
                  <form onSubmit={handleKirimUlasan} className="space-y-4" noValidate>
                    <fieldset>
                      <legend className="sr-only">Pilih rating bintang</legend>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingForm(star)}
                            aria-label={`Beri rating ${star} bintang`}
                            aria-pressed={star <= ratingForm}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <svg className={`w-8 h-8 ${star <= ratingForm ? 'text-[#8A1FFF]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <label htmlFor="teks-ulasan" className="sr-only">Teks ulasan</label>
                      <textarea
                        id="teks-ulasan"
                        required
                        minLength={10}
                        value={teksUlasan}
                        onChange={(e) => setTeksUlasan(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 text-sm bg-[#F2F2F2] border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none transition text-[#050505]"
                        placeholder="Tulis ulasan jujur Anda di sini (min. 10 karakter)..."
                      />
                      <p className="text-right text-[10px] text-gray-400 mt-1">{teksUlasan.length} karakter</p>
                    </div>
                    <button type="submit" className="w-full text-white text-sm font-bold py-3 rounded-xl transition shadow-md bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] hover:shadow-[#8A1FFF]/40 focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]">
                      Kirim Ulasan
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-[#F2F2F2] rounded-xl border border-gray-200">
                    <p className="text-gray-500 mb-2 text-xs">Masuk untuk memberikan ulasan.</p>
                    <button
                      onClick={() => { setIsModalOpen(true); setErrorMsg('') }}
                      className="bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white font-bold py-2 px-5 text-xs rounded-full shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[#8A1FFF]"
                    >
                      Masuk Sekarang
                    </button>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* ── FAQ ────────────────────────────────────────────────── */}
          <section id="faq" className="py-16 bg-white relative z-10 border-y border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#050505] mb-3">Pertanyaan Umum</h2>
                <p className="text-gray-600 text-base">Informasi yang sering ditanyakan oleh calon klien VQ Project.</p>
              </div>
              <div className="space-y-3" role="list">
                {faqData.map((faq, index) => (
                  <div key={index} className="bg-[#F2F2F2] border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300" role="listitem">
                    <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  aria-expanded={activeFaq === index}
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none group transition-colors duration-300"
                >
                  <span className="font-bold text-[#050505] text-sm md:text-base pr-4 group-hover:text-[#8A1FFF] transition-colors duration-300">{faq.tanya}</span>
                  <svg
                    className={`w-5 h-5 text-[#8A1FFF] transform transition-all duration-300 flex-shrink-0 group-hover:scale-120 ${activeFaq === index ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                    <div
                      className={`px-6 transition-all duration-300 ease-in-out ${activeFaq === index ? 'py-4 border-t border-gray-200 max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden py-0'}`}
                    >
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.jawab}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── KONTAK FORM FULL KEMBALI ─────────────────────────────────────────────── */}
          <section id="kontak" className="py-16 bg-[#F2F2F2]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl flex flex-col md:flex-row border border-gray-200">

                <div className="bg-gradient-to-br from-[#2F7BFF] to-[#8A1FFF] text-white p-8 md:p-12 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" aria-hidden="true"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" aria-hidden="true"></div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-3">Mari Berdiskusi!</h3>
                    <p className="text-white/90 mb-8 text-sm leading-relaxed">
                      Ceritakan visi bisnis Anda kepada VQ Project. Isi formulir ini dan kami akan segera menghubungi Anda dengan solusi terbaik.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30" aria-hidden="true">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        </div>
                        <a href="mailto:halo@vqproject.com" className="text-sm font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-white rounded">halo@vqproject.com</a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30" aria-hidden="true">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.124.551 4.191 1.6 6.012L.471 24l6.115-1.572a11.976 11.976 0 005.445 1.311h.005c6.645 0 12.03-5.385 12.03-12.031S18.676 0 12.031 0zm0 21.758a9.984 9.984 0 01-5.1-1.393l-.365-.218-3.791.975.992-3.696-.239-.38A9.972 9.972 0 012.046 12.03c0-5.503 4.478-9.982 9.985-9.982 5.504 0 9.982 4.479 9.982 9.982s-4.478 9.982-9.982 9.982zm5.48-7.498c-.3-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.779.979-.955 1.18-.176.202-.352.227-.654.076-.302-.151-1.272-.469-2.423-1.547-.895-.839-1.5-1.875-1.676-2.176-.176-.302-.019-.465.132-.62.135-.139.302-.353.452-.529.151-.176.202-.302.302-.504.101-.202.051-.378-.025-.529-.076-.151-.68-1.639-.931-2.244-.245-.589-.494-.509-.68-.518-.176-.009-.378-.009-.58-.009s-.53.076-.807.378c-.277.302-1.058 1.033-1.058 2.518 0 1.486 1.083 2.923 1.234 3.125.151.202 2.132 3.256 5.166 4.561.721.31 1.283.495 1.723.633.724.23 1.383.197 1.869.119.544-.087 1.782-.728 2.034-1.431.252-.703.252-1.307.176-1.431-.076-.126-.277-.202-.579-.353z" /></svg>
                        </div>
                        <a href="https://wa.me/6285729915469" target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-white rounded">+62 853-3656-7469</a>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30 flex-shrink-0 mt-0.5" aria-hidden="true">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <span className="text-sm font-bold">Jember, Jawa Timur, Indonesia</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F2F2F2] p-8 md:p-12 md:w-3/5 flex flex-col justify-center">
                  {user ? (
                <form onSubmit={handleKirimProyek} className="space-y-4" noValidate>
                  {pesanNotif && (
                    <div className={`p-3 rounded-xl text-sm font-bold text-center ${pesanNotif.includes('Berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pesanNotif}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nama-klien" className="block text-xs font-bold text-[#050505] mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                      <input id="nama-klien" type="text" required value={namaKlien} onChange={(e) => setNamaKlien(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none text-sm text-[#050505]" placeholder="Nama Anda" />
                    </div>
                    <div>
                      <label htmlFor="wa-klien" className="block text-xs font-bold text-[#050505] mb-1">Nomor WA <span className="text-red-500">*</span></label>
                      <input id="wa-klien" type="tel" required value={waKlien} onChange={(e) => setWaKlien(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none text-sm text-[#050505]" placeholder="0812..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="jenis-layanan" className="block text-xs font-bold text-[#050505] mb-1">Kebutuhan Website</label>
                      <select id="jenis-layanan" value={jenisLayanan} onChange={(e) => setJenisLayanan(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none text-sm text-[#050505]">
                        <option value="Company Profile">Company Profile</option>
                        <option value="Toko Online">Toko Online</option>
                        <option value="Web App / Sistem Custom">Web App / Sistem Custom</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="budget-proyek" className="block text-xs font-bold text-[#050505] mb-1">Estimasi Budget</label>
                      <select id="budget-proyek" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none text-sm text-[#050505]">
                        <option value="Rp 1.5 Juta - Rp 3 Juta">Rp 1.5 Juta - Rp 3 Juta</option>
                        <option value="Rp 3 Juta - Rp 5 Juta">Rp 3 Juta - Rp 5 Juta</option>
                        <option value="Di atas Rp 5 Juta">Di atas Rp 5 Juta</option>
                        <option value="Belum Yakin (Konsultasi)">Belum Yakin (Konsultasi)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pesan-proyek" className="block text-xs font-bold text-[#050505] mb-1">Detail Proyek <span className="text-red-500">*</span></label>
                    <textarea id="pesan-proyek" required value={pesanProyek} onChange={(e) => setPesanProyek(e.target.value)} rows="3" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8A1FFF] outline-none text-sm text-[#050505]" placeholder="Ceritakan kebutuhan dan fitur yang Anda inginkan..." />
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full text-white text-sm font-bold py-3.5 rounded-xl transition shadow-md mt-1 bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] hover:shadow-[#8A1FFF]/40 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isSubmitting ? 'Mengirim...' : 'Kirim Pesan Proyek →'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                  <div className="w-16 h-16 bg-[#F2F2F2] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h4 className="text-lg font-bold text-[#050505] mb-2">Formulir Terkunci</h4>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Anda wajib login terlebih dahulu untuk mengirimkan pengajuan proyek bisnis.</p>
                  <button onClick={() => { setIsModalOpen(true); setErrorMsg(''); }} className="bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] text-white font-bold py-2.5 px-8 rounded-full shadow-md transition hover:-translate-y-0.5">
                    Masuk Sekarang
                  </button>
                </div>
              )}
                </div>

              </div>
            </div>
          </section>

        </main>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          HALAMAN 2: PORTAL KLIEN (DASHBOARD)
      ═════════════════════════════════════════════════════════════════════════ */}
      {currentPage === 'dashboard' && (
        <main key="dashboard" className="flex-grow bg-[#F2F2F2] py-12 animate-fade-in-up duration-700">
          {!user ? (
             <div className="max-w-md mx-auto text-center py-20 px-4 animate-fade-in-up">
               <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
               <p className="text-gray-600 mb-6">Silakan masuk terlebih dahulu untuk mengakses Panel Klien.</p>
               <button onClick={() => setIsModalOpen(true)} className="bg-[#8A1FFF] text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">Masuk Sekarang</button>
             </div>
          ) : (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 animate-fade-in-up">
              
              {/* Header Dashboard */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6 mb-8">
                 {user.photoURL ? <img src={user.photoURL} className="w-20 h-20 rounded-full border-4 border-gray-100" alt="Profile" /> : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2F7BFF] to-[#8A1FFF] flex items-center justify-center text-white font-bold text-2xl">{user.email.charAt(0).toUpperCase()}</div>}
                 <div className="text-center md:text-left">
                   <h2 className="text-2xl font-extrabold text-[#050505]">Selamat Datang, {user.displayName || user.email.split('@')[0]}!</h2>
                   <p className="text-gray-500 text-sm mt-1">Dashboard Klien VQ Project</p>
                 </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 {/* Status Proyek (Simulasi) */}
                 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="text-[#8A1FFF]">●</span> Status Proyek Aktif</h3>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                       <p className="text-xs text-blue-500 font-bold mb-1 tracking-wide">PROYEK PENGEMBANGAN</p>
                       <p className="text-sm font-bold text-[#050505]">Aplikasi POS Kasir Modern (PWA)</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                       <div className="bg-gradient-to-r from-[#2F7BFF] to-[#8A1FFF] h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Proses Coding</span>
                      <span className="text-[#8A1FFF]">75%</span>
                    </div>
                 </div>

                 {/* Tagihan / Invoice */}
                 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="text-green-500">●</span> Status Pembayaran</h3>
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-gray-100 transition cursor-pointer">
                         <div>
                           <p className="text-xs text-gray-500 font-bold mb-1">INV-2026/05/01</p>
                           <p className="text-sm font-bold text-[#050505]">DP Proyek Website</p>
                         </div>
                         <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Lunas</span>
                      </div>
                    </div>
                 </div>
              </div>

            </div>
          )}
        </main>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          HALAMAN 3: KEBIJAKAN PRIVASI
      ═════════════════════════════════════════════════════════════════════════ */}
      {currentPage === 'privacy' && (
        <main className="flex-grow py-20 px-4 max-w-4xl mx-auto animate-fade-in-up">
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-sm">
            <h1 className="text-3xl font-extrabold mb-6">Kebijakan Privasi VQ Project</h1>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm md:text-base">
              <p>Keamanan data Anda adalah prioritas kami. Kebijakan Privasi ini menjelaskan bagaimana VQ Project mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan layanan kami.</p>
              <h3 className="font-bold text-[#050505] text-lg mt-6">1. Pengumpulan Informasi</h3>
              <p>Semua data yang dikirim melalui formulir kontak (nama, nomor telepon, alamat email) atau saat Anda mendaftar dan akan disimpan dengan aman menggunakan infrastruktur Firebase (Google).</p>
              <h3 className="font-bold text-[#050505] text-lg mt-6">2. Penggunaan Informasi</h3>
              <p>Informasi yang Anda berikan hanya akan digunakan untuk keperluan komunikasi proyek, penagihan, dan pemberian akses. Kami tidak akan pernah menjual alamat email atau nomor WhatsApp Anda kepada pihak ketiga mana pun.</p>
            </div>
            <button onClick={() => navigateTo('landing')} className="mt-8 px-6 py-2.5 bg-[#F2F2F2] text-[#050505] font-bold rounded-xl hover:bg-gray-200 transition">← Kembali ke Beranda</button>
          </div>
        </main>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          HALAMAN 4: SYARAT & KETENTUAN
      ═════════════════════════════════════════════════════════════════════════ */}
      {currentPage === 'terms' && (
        <main className="flex-grow py-20 px-4 max-w-4xl mx-auto animate-fade-in-up">
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-sm">
            <h1 className="text-3xl font-extrabold mb-6">Syarat & Ketentuan Layanan</h1>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm md:text-base">
              <p>Dengan menggunakan jasa VQ Project, klien menyetujui seluruh ketentuan yang berlaku di bawah ini:</p>
              <h3 className="font-bold text-[#050505] text-lg mt-6">1. Pembayaran dan Pengerjaan</h3>
              <p>Proses pengerjaan desain dan coding baru akan dimulai setelah pihak klien menyelesaikan pembayaran Down Payment (DP) minimal sebesar 50% dari total nilai kontrak yang disepakati.</p>
              <h3 className="font-bold text-[#050505] text-lg mt-6">2. Revisi dan Perpanjangan</h3>
              <p>Revisi website dilakukan sesuai dengan batasan kuota pada paket yang dipilih. Biaya perpanjangan nama domain dan hosting (server) tahunan adalah tanggung jawab penuh klien yang akan ditagihkan mulai tahun kedua layanan.</p>
            </div>
            <button onClick={() => navigateTo('landing')} className="mt-8 px-6 py-2.5 bg-[#F2F2F2] text-[#050505] font-bold rounded-xl hover:bg-gray-200 transition">← Kembali ke Beranda</button>
          </div>
        </main>
      )}
      
      {/* ── FOOTER GLOBAL FULL ───────────────────────────────────────────────────── */}
      <footer className="bg-gradient-to-r from-blue-950 to-[#8A1FFF] py-10 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

            <div className="col-span-1">
              <img src="/logo.png" alt="VQ Project" className="h-12 md:h-14 w-auto mb-4 hover:scale-105 transition-transform origin-left" />
              <p className="text-white/80 text-xs leading-relaxed">
                Mitra teknologi terpercaya Anda dalam membangun identitas digital yang profesional, responsif, dan siap bersaing di era modern.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Tautan Cepat</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={`footer-${link.id}`}>
                    <button onClick={() => navigateTo('landing', link.id)} className="text-white/70 hover:text-white transition text-xs flex items-center focus:outline-none focus:text-white">
                      <span className="text-[#8A1FFF] mr-2" aria-hidden="true">▸</span>{link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Hubungi Kami</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-[#8A1FFF] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-white/70 text-xs leading-relaxed">Jember, Jawa Timur<br/>Indonesia</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-[#8A1FFF] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:halo@vqproject.com" className="text-white/70 text-xs hover:text-white transition">halo@vqproject.com</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Ikuti Kami</h4>
              <div className="flex space-x-3">
                <a href="#" aria-label="Instagram VQ Project" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#8A1FFF] transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn VQ Project" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#8A1FFF] transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p className="text-xs font-medium text-white/50">&copy; {new Date().getFullYear()} VQ Project. Hak Cipta Dilindungi.</p>
              {/* Indikator Pengunjung */}
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-white/70 font-bold tracking-wide">
                  TOTAL KUNJUNGAN: <span className="text-white">{jumlahPengunjung.toLocaleString('id-ID')}</span>
                </p>
              </div>
            </div>
            <div className="flex space-x-5">
              <button onClick={() => navigateTo('privacy')} className="text-[10px] text-white/50 hover:text-white transition uppercase tracking-wide focus:outline-none focus:text-white">Kebijakan Privasi</button>
              <button onClick={() => navigateTo('terms')} className="text-[10px] text-white/50 hover:text-white transition uppercase tracking-wide focus:outline-none focus:text-white">Syarat & Ketentuan</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── TOMBOL WHATSAPP MENGAMBANG ─────────────────────────────────────── */}
      <a
        href="https://wa.me/6285729915469?text=Halo%20Admin%20VQ%20Project..."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp dengan VQ Project"
        className="fixed bottom-6 right-6 z-[90] bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-115 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#25D366]/40 transition-all duration-300 flex items-center justify-center group focus:outline-none"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.124.551 4.191 1.6 6.012L.471 24l6.115-1.572a11.976 11.976 0 005.445 1.311h.005c6.645 0 12.03-5.385 12.03-12.031S18.676 0 12.031 0zm0 21.758a9.984 9.984 0 01-5.1-1.393l-.365-.218-3.791.975.992-3.696-.239-.38A9.972 9.972 0 012.046 12.03c0-5.503 4.478-9.982 9.985-9.982 5.504 0 9.982 4.479 9.982 9.982s-4.478 9.982-9.982 9.982zm5.48-7.498c-.3-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.779.979-.955 1.18-.176.202-.352.227-.654.076-.302-.151-1.272-.469-2.423-1.547-.895-.839-1.5-1.875-1.676-2.176-.176-.302-.019-.465.132-.62.135-.139.302-.353.452-.529.151-.176.202-.302.302-.504.101-.202.051-.378-.025-.529-.076-.151-.68-1.639-.931-2.244-.245-.589-.494-.509-.68-.518-.176-.009-.378-.009-.58-.009s-.53.076-.807.378c-.277.302-1.058 1.033-1.058 2.518 0 1.486 1.083 2.923 1.234 3.125.151.202 2.132 3.256 5.166 4.561.721.31 1.283.495 1.723.633.724.23 1.383.197 1.869.119.544-.087 1.782-.728 2.034-1.431.252-.703.252-1.307.176-1.431-.076-.126-.277-.202-.579-.353z" />
        </svg>
        <span className="absolute right-full mr-3 bg-[#050505] text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg" aria-hidden="true">
          Konsultasi Gratis
        </span>
      </a>

      {/* ── TOMBOL BACK TO TOP ─────────────────────────────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas"
        className={`fixed bottom-24 right-6 z-[90] bg-white border border-gray-200 text-[#8A1FFF] p-3 rounded-full shadow-lg hover:scale-115 hover:-translate-y-1 hover:bg-[#8A1FFF] hover:text-white transition-all duration-300 focus:outline-none
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

    </div>
  )
}

export default App