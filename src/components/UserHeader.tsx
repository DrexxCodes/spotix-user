"use client"

import type React from "react"
import { useState } from "react"
import { Menu, X, CalendarPlus, User, Bot, CreditCard, AppWindow, Key, History, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import {
  HeaderContainer,
  LogoSection,
  Logo,
  Title,
  MenuIcon,
  NavOverlay,
  Nav,
  NavList,
  NavItem,
  Footer,
  FooterLink,
  CloseIcon,
  DesktopNav,
  DesktopNavList,
  DesktopNavItem,
} from "./header.styled"

const UserHeader: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  return (
    <>
      <HeaderContainer>
        <LogoSection>
          <Link href="/">
            <Logo src="/logo.svg" alt="Spotix Logo" />
          </Link>
          <Title>
            <Link href="/">Spotix</Link>
          </Title>
        </LogoSection>

        {/* Desktop Navigation */}
        <DesktopNav>
          <DesktopNavList>
            <DesktopNavItem>
              <Link href="/home">Home</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="/profile">My Profile</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="/ticket-history">My Tickets</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="/Referrals">Referrals</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="/wallet-history">Wallet History</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="/bookerdashboard">Auth Key</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="https://t.me/SpotixNG_bot">Telegram Bot</Link>
            </DesktopNavItem>
            <DesktopNavItem>
              <Link href="https://booker.spotix.com.ng">Dashboard</Link>
            </DesktopNavItem>
          </DesktopNavList>
        </DesktopNav>

        {/* Mobile Menu Icon */}
        <MenuIcon onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={28} /> : <Menu size={28} />}</MenuIcon>
      </HeaderContainer>

      {/* Mobile Navigation */}
      <NavOverlay $menuOpen={menuOpen} onClick={() => setMenuOpen(false)} />
      <Nav $menuOpen={menuOpen}>
        <NavList>
          <CloseIcon onClick={toggleMenu} />
          <NavItem onClick={() => setMenuOpen(false)}>
            <CalendarPlus size={20} />
            <Link href="/home">Home</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <User size={20} />
            <Link href="/profile">My Profile</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <CreditCard size={20} />
            <Link href="/ticket-history">My Tickets</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <ClipboardCheck size={20} />
            <Link href="/Referrals">Referrals</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <History size={20} />
            <Link href="/wallet-history">Wallet History</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <Key size={20} />
            <Link href="/user-v-auth">Auth Key</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <Bot size={20} />
            <Link href="https://t.me/SpotixNG_bot">Telegram Bot</Link>
          </NavItem>
          <NavItem onClick={() => setMenuOpen(false)}>
            <AppWindow size={20} />
            <Link href="https://booker.spotix.com.ng">Dashboard</Link>
          </NavItem>
        </NavList>

        <Footer>
          <FooterLink>
            <Link href="https://my.spotix.com.ng/privacy">Spotix Privacy Policy</Link>
          </FooterLink>
          <FooterLink>
            <Link href="https://my.spotix.com.ng/acceptable-usage">Terms and Conditions</Link>
          </FooterLink>
          <FooterLink>
            <Link href="https://tawk.to/chat/67f231fc2dd176190b3b2db3/1io7jc0ap">Contact Us</Link>
          </FooterLink>
        </Footer>
      </Nav>
    </>
  )
}

export default UserHeader
