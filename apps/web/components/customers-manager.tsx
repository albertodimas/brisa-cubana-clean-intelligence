"use client";

import type { Customer } from "@/lib/api";

type CustomersManagerProps = {
  customers: Customer[];
};

export function CustomersManager({ customers }: CustomersManagerProps) {
  return (
    <section className="ui-stack">
      <h3 className="ui-section-title">Clientes registrados</h3>
      {customers.length === 0 ? (
        <p className="ui-helper-text">No hay clientes disponibles.</p>
      ) : (
        <ul className="ui-panel-list">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="ui-panel-surface ui-panel-surface--muted flex flex-col gap-2"
            >
              <strong>{customer.fullName ?? "Cliente sin nombre"}</strong>
              <span className="ui-caption">{customer.email}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
