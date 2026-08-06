import { Search } from "lucide-react";

import { useRef, useState, useEffect } from "react";

import { useAuth } from "../../hooks/useAuth";
import { signOut } from "../../services/auth";

import {
    ChevronDown,
    User,
    LogOut,
} from "lucide-react";

import "./TopBar.css";

export default function TopBar() {

    const { user } = useAuth();

    const [menuOpen, setMenuOpen] =
        useState(false);

    const menuRef =
        useRef<HTMLDivElement>(null);

    const displayName =
        user?.user_metadata?.full_name ??
        user?.email?.split("@")[0] ??
        "User";

    const avatar =
        user?.user_metadata?.avatar_url ??
        null;

    useEffect(() => {

        function handleClickOutside(
            event: MouseEvent,
        ) {

            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node,
                )
            ) {
                setMenuOpen(false);
            }

        }

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );

        };

    }, []);

    async function handleSignOut() {

        setMenuOpen(false);

        await signOut();

    }

    return (

        <header className="platform-topbar">

            {/* ===========================================
                LEFT
            =========================================== */}

            <div className="platform-brand">

                <div className="platform-logo">
                    OTL
                </div>

                <div>

                    <h1>
                        OneTime Labs Platform
                    </h1>

                    <span>
                        Administration
                    </span>

                </div>

            </div>

            {/* ===========================================
                SEARCH
            =========================================== */}

            <div className="platform-search">

                <Search size={16} />

                <input
                    placeholder="Search..."
                />

            </div>

            {/* ===========================================
                USER
            =========================================== */}

            <div
                className="platform-user"
                ref={menuRef}
            >

                <button
                    className="platform-user-button"
                    onClick={() =>
                        setMenuOpen(
                            !menuOpen,
                        )
                    }
                >

                    {avatar ? (

                        <img
                            src={avatar}
                            alt=""
                            className="platform-avatar"
                        />

                    ) : (

                        <div className="platform-avatar-placeholder">

                            <User size={16} />

                        </div>

                    )}

                    <span>

                        {displayName}

                    </span>

                    <ChevronDown
                        size={16}
                    />

                </button>

                {menuOpen && (

                    <div className="platform-dropdown">

                        <button
                            onClick={
                                handleSignOut
                            }
                        >

                            <LogOut
                                size={16}
                            />

                            Sign Out

                        </button>

                    </div>

                )}

            </div>

        </header>

    );

}