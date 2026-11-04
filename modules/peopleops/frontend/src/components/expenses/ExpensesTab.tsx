import React, { useState } from 'react';
import { Button, Table, Badge, Dialog } from '@innostes/ui';

export const ExpensesTab: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [lineItems, setLineItems] = useState([{ expense_date: '', merchant_name: '', amount: '', category_id: '' }]);

    const addLineItem = () => {
        setLineItems([...lineItems, { expense_date: '', merchant_name: '', amount: '', category_id: '' }]);
    };

    const updateLineItem = (index: number, field: string, value: string) => {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setLineItems(newItems);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Expense Claims</h2>
                <Button onClick={() => setIsDialogOpen(true)}>New Claim</Button>
            </div>
            
            <Table>
                <thead>
                    <tr>
                        <th>Claim ID</th>
                        <th>Title</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Map through claims data here */}
                    <tr>
                        <td>EXP-001</td>
                        <td>Client Pitch Mumbai</td>
                        <td>₹14,020.00</td>
                        <td><Badge variant="success">Approved</Badge></td>
                    </tr>
                </tbody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="p-6 max-w-2xl w-full">
                    <h3 className="text-lg font-bold mb-4">Submit New Claim</h3>
                    <form>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input type="text" className="border p-2 w-full" placeholder="Enter claim title" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Business Purpose</label>
                            <textarea className="border p-2 w-full" placeholder="Enter business purpose" />
                        </div>

                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">Line Items</h4>
                            {lineItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                                    <div>
                                        <label className="block text-xs mb-1">Date</label>
                                        <input type="date" className="border p-1 w-full text-sm" value={item.expense_date} onChange={(e) => updateLineItem(index, 'expense_date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Category</label>
                                        <select className="border p-1 w-full text-sm" value={item.category_id} onChange={(e) => updateLineItem(index, 'category_id', e.target.value)}>
                                            <option value="">Select...</option>
                                            <option value="travel">Travel</option>
                                            <option value="meals">Meals</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Merchant</label>
                                        <input type="text" className="border p-1 w-full text-sm" value={item.merchant_name} onChange={(e) => updateLineItem(index, 'merchant_name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Amount (₹)</label>
                                        <input type="number" className="border p-1 w-full text-sm" value={item.amount} onChange={(e) => updateLineItem(index, 'amount', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="mt-2">+ Add Line Item</Button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Receipt Upload</label>
                            <input type="file" className="border p-2 w-full" />
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit Claim</Button>
                        </div>
                    </form>
                </div>
            </Dialog>
        </div>
    );
};
