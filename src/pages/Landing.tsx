import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RoleCard } from "@/components/RoleCard";
import { UserCog, Shield, CheckCircle2 } from "lucide-react";
import { SmoothScrollHero as Login } from "@/modules/auth/Login";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  const roles = [
    {
      role: "Supervisor",
      icon: UserCog,
      description: "Daily data entry and sheet submission",
      path: "/supervisor",
    },
    {
      role: "Project Manager",
      icon: Shield,
      description: "Review, modify, and approve workflows",
      path: "/pm",
    },
    {
      role: "PMRG",
      icon: CheckCircle2,
      description: "Advanced analytics and final approvals",
      path: "/pmrg",
    },
  ];

  return (
    <div className="min-h-screen relative">
      <Login />
    </div>
  );
};

export default Landing;