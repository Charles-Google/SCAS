import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, toHome } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    userName: ''
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    try {
      // 直接设置 token 和用户信息，跳过网络请求
      token.value = 'dummy-token'; // 设置一个虚拟的 token
      localStg.set('token', token.value);
      console.log("设置token");
      userInfo.userId = 'dummy-user-id';
      userInfo.userName = 'admin';

      // 初始化路由
      await routeStore.initAuthRoute();

        await toHome();
      

      if (true) {
        window.$notification?.success({
          message: $t('page.login.common.loginSuccess'),
          description: "欢迎回来"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      resetStore();
    } finally {
      endLoading();
    }
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. 存储在本地存储中，后续请求需要它在 headers 中
    // localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);

    // 2. 获取用户信息
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken.token;
      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  /**
   * Register
   *
   * @param userName User name
   * @param password Password
   * @param email Email
   * @param [redirect=true] Whether to redirect after registration. Default is `true`
   */
  async function register(userName: string, password: string, redirect = true) {
    startLoading();

    const { data, error } = await fetchRegister(userName, password);

    if (!error) {
      if (redirect) {
        await toLogin();
      }
    } else {
      const a = 1;
    }

    endLoading();
  }

  return {
    token,
    userInfo,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo,
    register
  };
});
