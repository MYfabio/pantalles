"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Estàs segur?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert("Error eliminando");
      }
    } catch (error) {
      alert("Error eliminando");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Usuaris</h1>
        <Link
          href="/dashboard/users/new"
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ background: "#1a3a5c" }}
        >
          + Nou usuari
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Rol</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Accions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-6 py-3">{user.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: user.role === "ADMIN" ? "#fee2e2" : "#eff6ff",
                      color: user.role === "ADMIN" ? "#991b1b" : "#1e40af",
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm space-x-2">
                  <Link
                    href={`/dashboard/users/${user.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hi ha usuaris. <Link href="/dashboard/users/new" className="text-blue-600">Crear-ne un</Link>
        </div>
      )}
    </div>
  );
}
