export const isUserInRole = (auth, role) => auth && auth.role && auth.role === role;
export const isUserAdmin = (auth) => isUserInRole(auth, roles.administrator);

export const hasPageAccessTo = (auth, aclRef) => isUserAdmin(auth) || auth.acl?.includes(aclRef);

export const hasContextAccessTo = (context, aclRef) => context.acl?.includes(aclRef);

export const roles = {
  administrator: "administrator",
};
