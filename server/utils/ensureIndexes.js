import ProductAssignment from "../models/ProductAssignment.js";

/**
 * Drop legacy unique compound index that blocked multiple assignments
 * of the same product to the same artisan.
 */
export const ensureAssignmentIndexes = async () => {
  try {
    const indexes = await ProductAssignment.collection.indexes();
    const legacy = indexes.find(
      (idx) => idx.name === "product_1_user_1_organization_1" && idx.unique,
    );
    if (legacy) {
      await ProductAssignment.collection.dropIndex(
        "product_1_user_1_organization_1",
      );
      console.log(
        "Dropped legacy unique index product_1_user_1_organization_1",
      );
    }
  } catch (err) {
    // Collection may not exist yet on first boot
    if (err?.codeName !== "NamespaceNotFound") {
      console.warn("ensureAssignmentIndexes:", err.message);
    }
  }

  try {
    await ProductAssignment.syncIndexes();
  } catch (err) {
    console.warn("ProductAssignment.syncIndexes:", err.message);
  }
};
