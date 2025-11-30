const DoorDashClient = require("@doordash/sdk");

const tokenContext = {
  key_id: "143ae480-3c5d-4926-8867-6b73ef926a12",
  developer_id: "4b4257ae-21cb-4ee6-ad7d-13d262ca709a",
  signing_secret: "tB3ok-ANri9tQpUoTtJROHZfAjFlH1WD92NHzJbsyNU",
};

const client = new DoorDashClient.DoorDashClient(tokenContext);

const response = client
  .createDelivery({
    external_delivery_id: "D-12346",
    pickup_address: "1000 4th Ave, Seattle, WA, 98104",
    pickup_phone_number: "+12065551234",
    dropoff_address: "1201 3rd Ave, Seattle, WA, 98101",
    dropoff_phone_number: "+12065551234",
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((err) => {
    console.log(err);
  });
