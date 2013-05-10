class CreateMessages < ActiveRecord::Migration
  def change
    create_table :messages do |t|
      t.string :sender
      t.datetime :time
      t.text :body
      t.integer :local_id
      t.string :facebook_id

      t.timestamps
    end
  end
end
