import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase';
import LoginPage from '../components/LoginPage.vue';
import HomePage from '../views/HomePage.vue';
import SellerDashboard from '../components/SellerDashboard.vue';
// import AdminDashboard from '../AdminDashboard.vue'; // Comentado temporalmente
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const routes = [
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/vendedor',
    name: 'SellerDashboard',
    component: SellerDashboard,
    meta: { requiresAuth: true, role: 'seller' }
  },
  // {
  //   path: '/admin',
  //   name: 'AdminDashboard',
  //   component: AdminDashboard,
  //   meta: { requiresAuth: true, role: 'admin' }
  // } // Comentado temporalmente
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.meta.role;

  // Esperar a que la autenticación se resuelva (persistencia incluida)
  const user = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!user && requiresAuth) {
    return next('/login');
  }

  if (user) {
    if (to.path === '/login') {
      const isAdmin = user.email === 'master1@example.com';
      const sellerDoc = await getDoc(doc(db, 'vendedores', user.uid));
      const isSeller = sellerDoc.exists();

      if (isAdmin) {
        return next('/');
      } else if (isSeller) {
        return next('/vendedor');
      } else {
        await auth.signOut();
        return next('/login');
      }
    }

    if (requiresAuth && requiredRole) {
      const isAdmin = user.email === 'master1@example.com';
      const sellerDoc = await getDoc(doc(db, 'vendedores', user.uid));
      const isSeller = sellerDoc.exists();

      if (requiredRole === 'admin' && isAdmin) {
        return next();
      } else if (requiredRole === 'seller' && isSeller) {
        return next();
      } else {
        await auth.signOut();
        if (isAdmin) {
          return next('/');
        } else if (isSeller) {
          return next('/vendedor');
        } else {
          return next('/login');
        }
      }
    }
  }

  return next();
});

export default router;