import { v4 as uuidv4 } from "uuid";
import { UserRecruteur } from "../model/index.js";

export default () => ({
  createApiKey: () => `mna-${uuidv4()}`,
  getUsers: async (query, options, { page, limit }) => {
    const response = await UserRecruteur.paginate(query, {
      ...options,
      page,
      limit,
      lean: true,
      select: "-password",
    });
    return {
      pagination: {
        page: response.page,
        result_per_page: limit,
        number_of_page: response.pages,
        total: response.total,
      },
      data: response.docs,
    };
  },
  getUser: (query) => UserRecruteur.findOne(query),
  createUser: async (values) => {
    let scope = values.scope ?? undefined;

    if (!scope) {
      if (values.type === "CFA") {
        // generate user scope
        let [key] = uuidv4().split("-");
        scope = `cfa-${key}`;
      } else {
        scope = `etp-${values.raison_sociale.toLowerCase().replace(/ /g, "-")}`;
      }
    }

    let isAdmin = values.isAdmin ?? false;

    let user = new UserRecruteur({
      ...values,
      isAdmin: isAdmin,
      scope: scope,
    });

    await user.save();
    user.password = undefined;
    return user.toObject();
  },
  updateUser: (userId, userPayload) => UserRecruteur.findOneAndUpdate({ _id: userId }, userPayload, { new: true }),
  removeUser: async (id) => {
    const user = await UserRecruteur.findById(id);
    if (!user) {
      throw new Error(`Unable to find user ${id}`);
    }

    return await user.deleteOne({ _id: id });
  },
  registerUser: (email) => UserRecruteur.findOneAndUpdate({ email }, { last_connection: new Date() }),
  updateUserValidationHistory: (userId, state) =>
    UserRecruteur.findByIdAndUpdate({ _id: userId }, { $push: { etat_utilisateur: state } }, { new: true }),
});
