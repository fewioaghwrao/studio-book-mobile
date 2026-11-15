/**
 * モバイルアプリの利用対象は一般会員のみ。
 * 複数ロールが付与された場合も管理者・ホストをモバイルにはログインさせない。
 * @param {string[] | undefined | null} roles
 */
export function isMobileGeneralUser(roles) {
  return Array.isArray(roles)
    && roles.includes('GeneralUser')
    && !roles.includes('Host')
    && !roles.includes('Admin');
}
