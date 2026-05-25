import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { Outlet } from "react-router-dom"

const PlansLayout = () => {
    return (
        <>

            <Header />
            <Outlet />
            <Footer />

        </>

    )
}

export default PlansLayout