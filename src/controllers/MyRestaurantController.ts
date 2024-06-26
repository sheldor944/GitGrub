import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import Order from "../models/order";
import Inventory from "../models/inventory";
import Employee from "../models/employee";
import User from "../models/user";
import {transporter , sendEmail} from "../middleware/SendOrderStatusEmail"




const searchEmployee = async (req : Request , res : Response) => {
  const restaurant = await Restaurant.findOne({ user: req.userId });
  const employeeName = req.params.employeeName

  try{
    let employee = await Employee.find({restaurant : restaurant?._id , name: { $regex: new RegExp(employeeName, "i")  }})
    console.log(employee)
    console.log(typeof(employee))
    if(Object.keys(employee).length === 0){
      return res.status(404).json({message : "No employee found"})
    }
    else{
      return res.json(employee)
    }
  }
  catch(error){
    res.json({message : "error in search employee "+ error})
  }
}

const updateEmployee = async (req : Request , res : Response ) => {
  try{
    const email = req.body.email ; 
    console.log('this is', req.body);

    let employee = await Employee.findOne({email : email});
    if(employee)
      {
        if(req.file)
          {
            const imageUrl = await uploadImage(req.file as Express.Multer.File);
    
            employee.imageUrl = imageUrl;

          }
        employee.resigningDate = req.body.resigningDate;
        employee.phone=req.body.phone;
        employee.role=req.body.role;
        employee.shiftDuration=req.body.shiftDuration;
        await employee.save();
        res.json(employee);
      }
      else{
        res.json({message : "No employee found"});
      }

  }
  catch(error)
  {
    res.json("update employee " + error);
  }
}

const getEmployee = async (req : Request , res : Response ) =>{
  try{
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found for the inventory "+ req .userId });
    }
    const  restaurantID = restaurant._id;
    const employee = await Employee.find({restaurant : restaurantID}); 
    console.log(employee);
    res.json(employee);
  }
  catch(error)
  {
    res.json({message: "Error happend in getEmployee " + error});
  }
}

const addEmployee = async (req : Request , res : Response ) => {
  try{
    console.log(req.body);
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found for the inventory "+ req .userId });
    }
    const  restaurantID = restaurant._id;
    // const imageUrl = await uploadImage(req.file as Express.Multer.File);
    let employee = new Employee(req.body);
    if(req.file)
      {
        const imageUrl = await uploadImage(req.file as Express.Multer.File);
        
        employee.imageUrl = imageUrl;
        
      }
      // employee.imageUrl = imageUrl;
      employee.restaurant = restaurantID; 
      console.log(employee)
    await employee.save();
    res.json(employee); 

  }
  catch(error)
  {
    console.log(error);
    res.json({message : " error in addEmployee " + error});
  }
}

const getInventory = async (req : Request , res : Response) => {

  try {
    // console.log(req);

    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found for the inventory "+ req .userId });
    }
    const  restaurantID = restaurant._id; 
    // console.log(restaurantID);
    const inventory = await Inventory.find({restaurant : restaurantID}); 
    // console.log(inventory);
    res.json(inventory);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching inventory" });
  }

}

const updateInventory = async (req : Request , res : Response) => {
    try{
      console.log(req.body);
      const restaurant = await Restaurant.findOne({ user: req.userId });
      if (!restaurant) {
        return res.status(404).json({ message: "restaurant not found for the inventory "+ req .userId });
      }
      const  restaurantID = restaurant._id; 
      const ingredientsName = req.body.itemName;

      let inventory = await Inventory.findOne({restaurant : restaurantID , itemName : ingredientsName});
      if (inventory) {
        let quantity = req.body.availabeQuantity; ; 
        inventory.availabeQuantity = quantity;
        await inventory.save(); 
        res.json(inventory);
    } else {
        res.json({message : "No inventory found "});
        // Handle case where no inventory is found
    }
      // res.json(inventory);
    }catch(error)
    {
      res.json({message : "error + " + error})
    }
}

const addInventory = async (req : Request , res : Response) =>  {
  try{
    const restaurantObj = await Restaurant.findOne({ user: req.userId });
      if (!restaurantObj) {
        return res.status(404).json({ message: "restaurant not found for the inventory "+ req .userId });
      }
      let inventory = new Inventory(req.body);
      console.log(inventory);
      inventory.restaurant = restaurantObj._id;
      await inventory.save();
      res.json(inventory);
  }
  catch(error)
  {

  }
}

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    console.log("this is the request ")
    console.log(req.body);
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      return res
        .status(409)
        .json({ message: "User restaurant already exists" });
    }

    const imageUrl = await uploadImage(req.file as Express.Multer.File);

    const restaurant = new Restaurant(req.body);
    console.log(restaurant._id);
    restaurant.imageUrl = imageUrl;
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    console.log( restaurant)
    await restaurant.save();

    res.status(201).send(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" + error  });
  }
};


const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    // console.log(req.body);
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();
    restaurant.searchingKeyWord=req.body.searchingKeyWord;

    // for (const menuItem of restaurant.menuItems) {
    //   for (const ingrediantsItem of menuItem.ingredients) {
    //     const ingrediantsItemName = ingrediantsItem.itemName ; 
    //     const ingrediantsItemAmount = ingrediantsItem.quantity;
    //     const restaurantID = restaurant._id; 
    //     const existingInventory = await Inventory.find({restaurant : restaurantID , itemName : ingrediantsItemName}) ;
    //     // console.log("this is the existing Inventory");
    //     // console.log(existingInventory);
    //     if(existingInventory.length === 0)
    //       {
    //           const inventory = new Inventory({
    //             restaurant : restaurantID, 
    //             itemName : ingrediantsItemName, 
    //             needingAmount : ingrediantsItemAmount
    //           })
    //           // console.log("this inventory is going to the db ");
    //           // console.log(inventory);
    //           await inventory.save();
    //       }
        // here add this inventoryu to the db  
        // console.log("total ingredients item ")
        // console.log(ingrediantsItem);
    //   }
    // }

    if (req.file) {
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" + error });
  }
};

const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user")
      .sort({createdAt : 'desc'});

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }
    const customerID = order.user 
    const customerUser = await User.findById(customerID)
    if(customerUser){

      const customerEmail = customerUser.email
      try{
        let message = "";
        console.log(status)

        if (status === "placed") {
          message = "Your order has been successfully placed. We'll notify you once it's confirmed by the restaurant.";
        } else if (status === "paid") {
          message = "Your order is awaiting confirmation from the restaurant. We'll keep you updated.";
        } else if (status === "inProgress") {
          message = "Your order is now in progress. Our team is working to prepare your delicious meal.";
        } else if (status === "outForDelivery") {
          message = "Your order is out for delivery. It will be arriving shortly. Thank you for choosing us!";
        } else if (status === "delivered") {
          message = "Your order has been successfully delivered. We hope you enjoy your meal. Thank you for your order!";
        } else {
          message = "Invalid order status.";
        }

        sendEmail(customerEmail , status, message)
      }
      catch(error){
        console.log("error in sending email "+ error)
      }
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (restaurant?.user?._id.toString() !== req.userId) {
      return res.status(401).send();
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "unable to update order status" });
  }
};

const uploadImage = async (file: Express.Multer.File) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  updateOrderStatus,
  getMyRestaurantOrders,
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
  updateInventory,
  getInventory, 
  addInventory,
  addEmployee,
  getEmployee,
  updateEmployee,
  searchEmployee
};
