import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    query, 
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ===== Toast Notifications =====
export function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer') || createToastContainer();

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===== Loading Screen =====
export function showLoading(message = 'جاري التحميل...') {
    let loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) {
        loadingScreen = document.createElement('div');
        loadingScreen.id = 'loadingScreen';
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-logo">💚</div>
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(loadingScreen);
    } else {
        loadingScreen.querySelector('.loading-text').textContent = message;
        loadingScreen.classList.remove('hidden');
    }
}

export function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// ===== Auth Functions =====
export async function register(id, name, password, confirmPassword) {
    if (!id || !name || !password) {
        showToast('خطأ', 'الرجاء ملء جميع الحقول', 'error');
        return false;
    }

    if (password !== confirmPassword) {
        showToast('خطأ', 'كلمتا المرور غير متطابقتين', 'error');
        return false;
    }

    if (password.length < 6) {
        showToast('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return false;
    }

    showLoading('جاري إنشاء الحساب...');

    try {
        const email = id + '@kafalaty.app';
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: id,
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        showToast('تم بنجاح', 'تم إنشاء الحساب، جاري تسجيل الدخول...', 'success');
        return true;
    } catch (error) {
        hideLoading();
        if (error.code === 'auth/email-already-in-use') {
            showToast('خطأ', 'رقم الهوية مسجل مسبقاً', 'error');
        } else {
            showToast('خطأ', 'حدث خطأ، حاول مرة أخرى', 'error');
        }
        return false;
    }
}

export async function login(id, password) {
    if (!id || !password) {
        showToast('خطأ', 'الرجاء إدخال رقم الهوية وكلمة المرور', 'error');
        return false;
    }

    showLoading('جاري تسجيل الدخول...');

    try {
        const email = id + '@kafalaty.app';
        await signInWithEmailAndPassword(auth, email, password);
        showToast('أهلاً بك', 'تم تسجيل الدخول بنجاح', 'success');
        return true;
    } catch (error) {
        hideLoading();
        showToast('خطأ', 'رقم الهوية أو كلمة المرور غير صحيحة', 'error');
        return false;
    }
}

export async function logout() {
    showLoading('جاري تسجيل الخروج...');
    await signOut(auth);
    hideLoading();
    showToast('تم', 'تم تسجيل الخروج', 'info');
}

// ===== Child Functions =====
export async function addChild(name, age) {
    if (!name || !age) {
        showToast('خطأ', 'الرجاء إدخال اسم الطفل والعمر', 'error');
        return null;
    }

    showLoading('جاري إضافة الطفل...');

    try {
        const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'children'), {
            name: name,
            age: parseInt(age),
            createdAt: new Date().toISOString()
        });

        hideLoading();
        showToast('تم بنجاح', 'تم إضافة الطفل', 'success');
        return docRef.id;
    } catch (error) {
        hideLoading();
        showToast('خطأ', 'حدث خطأ أثناء الإضافة', 'error');
        return null;
    }
}

export async function deleteChild(childId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطفل وجميع كفالاته؟')) return false;

    showLoading('جاري الحذف...');

    try {
        // Delete all kafalat first
        const kafalatSnapshot = await getDocs(collection(db, 'users', auth.currentUser.uid, 'children', childId, 'kafalat'));
        for (const kafalaDoc of kafalatSnapshot.docs) {
            await deleteDoc(kafalaDoc.ref);
        }

        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'children', childId));

        hideLoading();
        showToast('تم', 'تم الحذف بنجاح', 'success');
        return true;
    } catch (error) {
        hideLoading();
        showToast('خطأ', 'حدث خطأ أثناء الحذف', 'error');
        return false;
    }
}

export async function loadChildren() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const snapshot = await getDocs(
            query(collection(db, 'users', user.uid, 'children'), orderBy('createdAt', 'desc'))
        );

        const children = [];
        for (const doc of snapshot.docs) {
            const child = { id: doc.id, ...doc.data() };

            // Calculate total kafalat
            const kafalatSnapshot = await getDocs(
                collection(db, 'users', user.uid, 'children', doc.id, 'kafalat')
            );

            let total = 0;
            kafalatSnapshot.forEach(kafalaDoc => {
                total += kafalaDoc.data().amount;
            });

            child.totalKafalat = total;
            child.kafalatCount = kafalatSnapshot.size;
            children.push(child);
        }

        return children;
    } catch (error) {
        showToast('خطأ', 'حدث خطأ أثناء التحميل', 'error');
        return [];
    }
}

// ===== Kafala Functions =====
export async function addKafala(childId, org, amount, date, notes) {
    if (!org || !amount || !date) {
        showToast('خطأ', 'الرجاء ملء جميع الحقول المطلوبة', 'error');
        return false;
    }

    showLoading('جاري حفظ الكفالة...');

    try {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'children', childId, 'kafalat'), {
            organization: org,
            amount: parseFloat(amount),
            date: date,
            notes: notes || '',
            createdAt: new Date().toISOString()
        });

        hideLoading();
        showToast('تم بنجاح', 'تم إضافة الكفالة', 'success');
        return true;
    } catch (error) {
        hideLoading();
        showToast('خطأ', 'حدث خطأ أثناء الحفظ', 'error');
        return false;
    }
}

export async function deleteKafala(childId, kafalaId) {
    if (!confirm('هل أنت متأكد من حذف هذه الكفالة؟')) return false;

    showLoading('جاري الحذف...');

    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'children', childId, 'kafalat', kafalaId));
        hideLoading();
        showToast('تم', 'تم حذف الكفالة', 'success');
        return true;
    } catch (error) {
        hideLoading();
        showToast('خطأ', 'حدث خطأ أثناء الحذف', 'error');
        return false;
    }
}

export async function loadKafalat(childId) {
    try {
        const snapshot = await getDocs(
            query(
                collection(db, 'users', auth.currentUser.uid, 'children', childId, 'kafalat'),
                orderBy('date', 'desc')
            )
        );

        const kafalat = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // تأكد من وجود العملة، لو مش موجودة خليها شيكل
            if (!data.currency) {
                data.currency = 'ILS';
            }
            kafalat.push({ id: doc.id, ...data });
        });

        return kafalat;
    } catch (error) {
        showToast('خطأ', 'حدث خطأ أثناء التحميل', 'error');
        return [];
    }
}

export async function loadOrganizations() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const childrenSnapshot = await getDocs(collection(db, 'users', user.uid, 'children'));
        const orgs = new Set();

        for (const childDoc of childrenSnapshot.docs) {
            const kafalatSnapshot = await getDocs(
                collection(db, 'users', user.uid, 'children', childDoc.id, 'kafalat')
            );
            kafalatSnapshot.forEach(kafalaDoc => {
                orgs.add(kafalaDoc.data().organization);
            });
        }

        return Array.from(orgs);
    } catch (error) {
        return [];
    }
}

// ===== Auth State Listener =====
export function initAuth(callback) {
    onAuthStateChanged(auth, (user) => {
        hideLoading();
        callback(user);
    });
}

// ===== Format Currency =====
export function formatCurrency(amount) {
    return amount.toLocaleString('ar-SA') + ' ₪';
}

// ===== Format Date =====
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}
