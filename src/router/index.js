import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/success',
      name: 'success',
      component: () => import('../views/SuccessView.vue'),
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/shops',
      name: 'shops',
      component: () => import('../views/ShopsView.vue'),
    },
    {
      path: '/shops/:id',
      name: 'shop-detail',
      component: () => import('../views/ShopDetailView.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue'),
    },
    {
      path: '/orders/:orderNo',
      name: 'order-detail',
      component: () => import('../views/OrderDetailView.vue'),
    },
    {
      path: '/after-sales',
      name: 'after-sales',
      component: () => import('../views/AfterSalesView.vue'),
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('../views/AdminCategoriesView.vue'),
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/AdminUsersView.vue'),
    },
    {
      path: '/seller/orders',
      name: 'seller-orders',
      component: () => import('../views/SellerOrdersView.vue'),
    },
    {
      path: '/seller/products',
      name: 'seller-products',
      component: () => import('../views/SellerProductsView.vue'),
    },
    {
      path: '/seller/orders/:orderNo',
      name: 'seller-order-detail',
      component: () => import('../views/SellerOrderDetailView.vue'),
    },
    {
      path: '/seller/after-sales',
      name: 'seller-after-sales',
      component: () => import('../views/SellerAfterSalesView.vue'),
    },
  ],
})

export default router
