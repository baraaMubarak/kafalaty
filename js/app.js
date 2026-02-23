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
        
        // عرض تفاصيل الخطأ كاملة في التوست
        let errorMessage = error.message || 'حدث خطأ، حاول مرة أخرى';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'رقم الهوية مسجل مسبقاً';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'مشكلة في الصلاحيات - Firestore Rules';
        } else if (error.code) {
            errorMessage = `خطأ: ${error.code} - ${error.message}`;
        }
        
        // عرض الخطأ كامل في التوست (حتى لو طويل)
        showToast('تفاصيل الخطأ', errorMessage, 'error');
        
        return false;
    }
}
