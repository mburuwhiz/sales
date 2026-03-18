exports.syncCart = async (req, res) => {
  try {
    const { cart } = req.body;
    req.session.cart = cart; // Sync to express session as requested
    res.status(200).json({ message: 'Cart synced to session' });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing cart' });
  }
};
