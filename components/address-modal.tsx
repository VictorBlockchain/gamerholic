import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (address: AddressData) => void
}

interface AddressData {
  full_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  phone_number: string
}

export function AddressModal({ isOpen, onClose, onSubmit }: AddressModalProps) {
  const [addressData, setAddressData] = useState<AddressData>({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone_number: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAddressData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(addressData)
    setAddressData({
      full_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      phone_number: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={addressData.full_name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              name="address_line1"
              value={addressData.address_line1}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input id="address_line2" name="address_line2" value={addressData.address_line2} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={addressData.city} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" value={addressData.state} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              name="postal_code"
              value={addressData.postal_code}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={addressData.country} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={addressData.phone_number}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit">Add Address</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

