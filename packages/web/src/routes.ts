import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { SportsView } from "./views/Sports"
import { HomeView } from "./views/Home";
import { PaymentsView } from "./views/Payments"
import { LockersView } from "./views/Lockers";
import { DisciplinesView } from "./views/Disciplines";
import { EquipmentLoansView } from "./views/EquipmentLoans";
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
      {
        path: "/disciplines",
        Component: DisciplinesView,
      },
      {
        path: "/equipment-loans",
        Component: EquipmentLoansView,
      },
      
    ],
  },
]);
